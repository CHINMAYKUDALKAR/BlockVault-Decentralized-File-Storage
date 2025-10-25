from __future__ import annotations
"""Background poller that ingests on-chain FileAccessRegistry events into the
off-chain convenience index (file_access_roles collection).

Design notes:
 - Runs best-effort; failures are logged and retried with backoff.
 - Processes logs in block ranges, respecting a confirmation depth to reduce
   reorg churn (default 3 blocks).
 - Uses a small state document in `file_access_sync_state` to persist the last
   processed block so restarts resume quickly.
 - Maintains a `file_hash_index` mapping file_id -> keccak(file_id) so we can
   reverse match logs (by precomputing all known file ids). For each new file
   upload we recommend inserting into this index (handled lazily here too).
 - Idempotent: re-processing an already seen event for same (file_id,address)
   just upserts the same record.

Environment / app.config keys used:
  ETH_RPC_URL
  FILE_ACCESS_CONTRACT
  FILE_ACCESS_SYNC_ENABLED (truthy to enable) optional
  FILE_ACCESS_SYNC_INTERVAL (seconds) optional
  FILE_ACCESS_CONFIRMATIONS (int) optional
"""
import threading
import time
import traceback
from typing import Any, Dict, Optional, List

from flask import current_app
from web3 import Web3
from web3.middleware import geth_poa_middleware

_STATE_ID = "global"

_ROLE_SET_SIG = Web3.keccak(text="RoleSet(bytes32,address,uint8)").hex()
_ROLE_REVOKED_SIG = Web3.keccak(text="RoleRevoked(bytes32,address)").hex()


def _db():
    from .db import get_db  # local import to avoid circular
    return get_db()


def _coll_roles():
    return _db()["file_access_roles"]


def _coll_state():
    return _db()["file_access_sync_state"]


def _coll_files():
    return _db()["files"]


def _coll_hash_index():
    return _db()["file_hash_index"]


def _keccak(text: str) -> str:
    return Web3.keccak(text=text).hex()


def _backfill_hash_index():
    try:
        coll_files = _coll_files()
        coll_idx = _coll_hash_index()
        # Iterate minimally; memory backend fallback uses .find returning iterable
        seen = {d.get("file_id") for d in coll_idx.find({})}  # type: ignore[attr-defined]
        for f in coll_files.find({}):  # type: ignore[attr-defined]
            fid = str(f.get("_id"))
            if fid in seen:
                continue
            try:
                coll_idx.update_one({"file_id": fid}, {"$set": {"file_id": fid, "file_hash": _keccak(fid)}}, upsert=True)
            except Exception:
                pass
    except Exception:
        pass


def _load_hash_map() -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    try:
        for d in _coll_hash_index().find({}):  # type: ignore[attr-defined]
            fh = d.get("file_hash")
            fid = d.get("file_id")
            if isinstance(fh, str) and isinstance(fid, str):
                mapping[fh.lower()] = fid
    except Exception:
        pass
    return mapping


def _update_state(new_last_block: int, chain_id: int, contract: str) -> None:
    try:
        _coll_state().update_one({"_id": _STATE_ID}, {"$set": {"last_block": new_last_block, "chain_id": chain_id, "contract": contract}}, upsert=True)
    except Exception:
        pass


def _get_state() -> Dict[str, Any]:
    try:
        doc = _coll_state().find_one({"_id": _STATE_ID}) or {}
        return doc
    except Exception:
        return {}


def _record_role(file_id: str, address: str, role: str):
    try:
        doc = {"file_id": file_id, "address": Web3.to_checksum_address(address), "role": role, "updated_at": int(time.time() * 1000)}
        _coll_roles().update_one({"file_id": file_id, "address": doc["address"]}, {"$set": doc}, upsert=True)
    except Exception:
        pass


def _delete_role(file_id: str, address: str):
    try:
        _coll_roles().delete_one({"file_id": file_id, "address": Web3.to_checksum_address(address)})
    except Exception:
        pass


def _poll_loop():
    app = current_app._get_current_object()
    rpc = app.config.get("ETH_RPC_URL")
    contract_addr = app.config.get("FILE_ACCESS_CONTRACT")
    if not rpc or not contract_addr:
        app.logger.info("[file_access_sync] Disabled (missing RPC or contract)")
        return
    interval = int(app.config.get("FILE_ACCESS_SYNC_INTERVAL", 20))
    confirmations = int(app.config.get("FILE_ACCESS_CONFIRMATIONS", 3))
    w3 = Web3(Web3.HTTPProvider(rpc))
    try:
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    except Exception:
        pass
    try:
        chain_id = w3.eth.chain_id
    except Exception as e:
        app.logger.warning(f"[file_access_sync] Cannot fetch chain id: {e}")
        return
    # Backfill hash index at start
    _backfill_hash_index()
    state = _get_state()
    last_block = int(state.get("last_block") or 0)
    if state.get("chain_id") != chain_id or state.get("contract") != Web3.to_checksum_address(contract_addr):
        last_block = 0  # reset on mismatch
    backoff = interval
    app.logger.info(f"[file_access_sync] Starting poller chain={chain_id} interval={interval}s confirmations={confirmations} from_block={last_block or 'latest'}")
    while True:
        try:
            latest = w3.eth.block_number
            target = latest - confirmations
            if target < 0:
                time.sleep(interval)
                continue
            start_block = last_block + 1 if last_block else target  # if first run start at (latest - confirmations)
            if start_block > target:
                time.sleep(interval)
                continue
            # Limit range size
            end_block = min(start_block + 1999, target)
            # Build topics filters
            role_set_topic = _ROLE_SET_SIG
            role_rev_topic = _ROLE_REVOKED_SIG
            logs: List[Any] = []  # type: ignore[var-annotated]
            for event_topic in (role_set_topic, role_rev_topic):
                flt = {
                    "fromBlock": start_block,
                    "toBlock": end_block,
                    "address": Web3.to_checksum_address(contract_addr),
                    "topics": [event_topic],
                }
                try:
                    logs.extend(w3.eth.get_logs(flt))
                except Exception as e:
                    app.logger.warning(f"[file_access_sync] get_logs error {e}")
                    raise
            if logs:
                hash_map = _load_hash_map()
                for lg in logs:
                    topics = lg.get("topics") or []
                    if not topics:
                        continue
                    sig = topics[0].hex() if hasattr(topics[0], 'hex') else (topics[0] if isinstance(topics[0], str) else None)
                    data_bytes = bytes.fromhex(lg.get("data", "0x")[2:]) if lg.get("data") else b""
                    # topic[1] fileHash (indexed), topic[2] user (indexed)
                    file_hash = topics[1].hex().lower() if len(topics) > 1 and hasattr(topics[1], 'hex') else None
                    user_addr = topics[2].hex() if len(topics) > 2 and hasattr(topics[2], 'hex') else None
                    if not file_hash or not user_addr:
                        continue
                    fid = hash_map.get(file_hash.lower())
                    if not fid:
                        # If unknown, we could not map yet; ignore (may be someone granted before upload indexing?)
                        continue
                    if sig == role_set_topic:
                        # decode last byte (role) from data (uint8)
                        role_val = data_bytes[-1] if data_bytes else 0
                        if role_val == 0:
                            _delete_role(fid, user_addr)
                        else:
                            role_str = 'owner' if role_val == 2 else 'viewer'
                            _record_role(fid, user_addr, role_str)
                    elif sig == role_rev_topic:
                        _delete_role(fid, user_addr)
            last_block = end_block
            _update_state(last_block, chain_id, Web3.to_checksum_address(contract_addr))
            backoff = interval  # reset backoff on success
        except Exception as e:  # log and apply backoff
            app.logger.warning(f"[file_access_sync] loop error: {e}\n{traceback.format_exc(limit=4)}")
            time.sleep(backoff)
            backoff = min(backoff * 2, interval * 8)
            continue
        time.sleep(interval)


_started = False
_lock = threading.Lock()


def start_background_sync_if_enabled():
    global _started
    with _lock:
        if _started:
            return
        app = current_app
        if str(app.config.get("FILE_ACCESS_SYNC_ENABLED", "1")).lower() not in {"1", "true", "yes"}:
            app.logger.info("[file_access_sync] Not enabled by config")
            _started = True
            return
        # Quick validation of essentials
        if not app.config.get("ETH_RPC_URL") or not app.config.get("FILE_ACCESS_CONTRACT"):
            app.logger.info("[file_access_sync] Missing RPC or contract; background sync disabled")
            _started = True
            return
        t = threading.Thread(target=lambda: app.app_context().push() or _poll_loop(), name="file-access-sync", daemon=True)
        t.start()
        _started = True
        app.logger.info("[file_access_sync] Background sync thread started")
