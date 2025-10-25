from __future__ import annotations

import threading
import time
from enum import IntEnum
from typing import Any, Dict, Optional, Tuple

from flask import current_app, abort, request
from web3 import Web3
try:
    from web3.middleware import geth_poa_middleware
except ImportError:
    try:
        from web3.middleware import ExtraDataToPOAMiddleware as geth_poa_middleware
    except ImportError:
        # Fallback for newer Web3 versions
        geth_poa_middleware = None


class Role(IntEnum):
    NONE = 0
    VIEWER = 1
    OWNER = 2
    ADMIN = 3


_ROLE_NAMES = {
    Role.NONE: "none",
    Role.VIEWER: "viewer",
    Role.OWNER: "owner",
    Role.ADMIN: "admin",
}

_ROLE_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
        "name": "roleOf",
        "outputs": [{"internalType": "enum RoleRegistry.Role", "name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function",
    }
]

_CACHE_TTL = 60.0
_role_cache: Dict[str, Tuple[float, Role]] = {}
_cache_lock = threading.Lock()
_contract_lock = threading.Lock()
_contract_cache: Dict[str, Tuple[Web3, Any]] = {}
_warned_not_configured = False


def role_name(role: Role) -> str:
    return _ROLE_NAMES.get(role, "unknown")


def _get_contract() -> Optional[Tuple[Web3, Any]]:
    global _warned_not_configured
    cfg = current_app.config
    rpc_url = cfg.get("ETH_RPC_URL")
    contract_addr = cfg.get("ROLE_REGISTRY_ADDRESS")
    if not rpc_url or not contract_addr:
        if not _warned_not_configured:
            current_app.logger.warning(
                "RBAC contract not configured (ETH_RPC_URL / ROLE_REGISTRY_ADDRESS missing); defaulting to ADMIN"
            )
            _warned_not_configured = True
        return None

    key = f"{rpc_url}|{contract_addr.lower()}"
    with _contract_lock:
        if key in _contract_cache:
            return _contract_cache[key]
        try:
            w3 = Web3(Web3.HTTPProvider(rpc_url))
            # Inject PoA middleware for testnets like Sepolia
            if geth_poa_middleware is not None:
                try:
                    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
                except (ValueError, AttributeError):  # middleware already present
                    pass
            contract = w3.eth.contract(address=Web3.to_checksum_address(contract_addr), abi=_ROLE_ABI)
            _contract_cache[key] = (w3, contract)
            return _contract_cache[key]
        except Exception as exc:
            current_app.logger.error("Failed to instantiate RBAC contract: %s", exc)
            return None


def get_role(address: str) -> Role:
    address = Web3.to_checksum_address(address)
    cache_key = address.lower()
    now = time.time()
    with _cache_lock:
        cached = _role_cache.get(cache_key)
        if cached and now - cached[0] < _CACHE_TTL:
            return cached[1]

    contract_info = _get_contract()
    if contract_info is None:
        # Default permissive (admin) when not configured
        role = Role.ADMIN
    else:
        _, contract = contract_info
        try:
            raw_role = contract.functions.roleOf(address).call()
            role = Role(raw_role) if raw_role in Role._value2member_map_ else Role.NONE
        except Exception as exc:
            current_app.logger.error("RBAC role lookup failed for %s: %s", address, exc)
            role = Role.NONE

    with _cache_lock:
        _role_cache[cache_key] = (now, role)
    return role


def ensure_role(min_role: Role, user_role: Optional[Role] = None) -> Role:
    role = user_role if user_role is not None else getattr(request, "role", Role.NONE)
    if isinstance(role, int):
        role = Role(role)
    if role < min_role:
        abort(403, f"{role_name(min_role)} role required")
    return role


def attach_role(address: str) -> Role:
    role = get_role(address)
    setattr(request, "role", role)
    setattr(request, "role_name", role_name(role))
    return role


def clear_role_cache() -> None:
    with _cache_lock:
        _role_cache.clear()