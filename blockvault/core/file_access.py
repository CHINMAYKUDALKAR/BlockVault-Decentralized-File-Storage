from __future__ import annotations
"""Optional smart-contract based file access checks.

This module provides a minimal abstraction to allow querying an on-chain
contract to determine if an address may view a file. It is intentionally
best-effort: failures return False so that DB-based shares remain the
primary access path unless a share exists.

Environment / config expectations (via Flask app.config):
  FILE_ACCESS_CONTRACT (address) optional
  ETH_RPC_URL (already used for role registry) optional

If not configured, can_view returns False (caller should fall back to DB share logic).
"""
from typing import Any
from flask import current_app
from web3 import Web3
from web3.middleware import geth_poa_middleware

# Simplified ABI subset for FileAccessRegistry:
# canView(bytes32,address) -> bool
# roleOf(bytes32,address) -> uint8 (0=None,1=Viewer,2=Owner)
_FILE_ACCESS_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "fileId", "type": "bytes32"},
            {"internalType": "address", "name": "user", "type": "address"},
        ],
        "name": "canView",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "fileId", "type": "bytes32"},
            {"internalType": "address", "name": "user", "type": "address"},
        ],
        "name": "roleOf",
        "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    },
]

_cached = None

def _get_contract():  # type: ignore
    global _cached
    if _cached is not None:
        return _cached
    rpc = current_app.config.get("ETH_RPC_URL")
    addr = current_app.config.get("FILE_ACCESS_CONTRACT")
    if not rpc or not addr:
        return None
    try:
        w3 = Web3(Web3.HTTPProvider(rpc))
        try:
            w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        except Exception:
            pass
        contract = w3.eth.contract(address=Web3.to_checksum_address(addr), abi=_FILE_ACCESS_ABI)
        _cached = (w3, contract)
        return _cached
    except Exception:
        return None


def _to_bytes32(file_id: str) -> bytes:
    # Hash string id (ObjectId) to deterministic bytes32
    return Web3.keccak(text=file_id)


def can_view(file_id: str, user: str) -> bool:
    info = _get_contract()
    if info is None:
        return False
    _, contract = info
    try:
        return bool(contract.functions.canView(_to_bytes32(file_id), Web3.to_checksum_address(user)).call())
    except Exception:
        return False


def get_role(file_id: str, user: str) -> int:
    """Return numeric role from on-chain registry (0=None,1=Viewer,2=Owner) or -1 on failure/not configured."""
    info = _get_contract()
    if info is None:
        return -1
    _, contract = info
    try:
        return int(contract.functions.roleOf(_to_bytes32(file_id), Web3.to_checksum_address(user)).call())
    except Exception:
        return -1
