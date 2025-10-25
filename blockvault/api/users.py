from __future__ import annotations

import time
from typing import Any, Dict

from flask import Blueprint, abort, request
from cryptography.hazmat.primitives import serialization

from ..core.db import get_db
from ..core.security import require_auth
from ..core.rbac import Role, ensure_role, role_name
from flask import current_app

bp = Blueprint("users", __name__)


def _users_collection():
    return get_db()["users"]


@bp.get("/profile")
@require_auth
def profile():  # type: ignore
    ensure_role(Role.VIEWER)
    address = getattr(request, "address")
    doc: Dict[str, Any] = _users_collection().find_one({"address": address}) or {}
    include_key = request.args.get("with_key") == "1"
    resp: Dict[str, Any] = {
        "address": address,
        "role": role_name(getattr(request, "role", Role.NONE)),
        "role_value": int(getattr(request, "role", Role.NONE)),
        "has_public_key": bool(doc.get("sharing_pubkey")),
    }
    if include_key and doc.get("sharing_pubkey"):
        resp["public_key_pem"] = doc.get("sharing_pubkey")
    return resp


@bp.post("/public_key")
@require_auth
def set_public_key():  # type: ignore
    ensure_role(Role.VIEWER)
    payload = request.get_json(silent=True) or {}
    pem = payload.get("public_key_pem")
    if not pem or not isinstance(pem, str):
        abort(400, "public_key_pem required")
    try:
        serialization.load_pem_public_key(pem.encode("utf-8"))
    except Exception as exc:
        abort(400, f"invalid public key: {exc}")
    now_ms = int(time.time() * 1000)
    address = getattr(request, "address")
    _users_collection().update_one(
        {"address": address},
        {"$set": {"sharing_pubkey": pem, "sharing_key_updated_at": now_ms}},
        upsert=True,
    )
    return {"status": "ok", "updated_at": now_ms}


@bp.delete("/public_key")
@require_auth
def delete_public_key():  # type: ignore
    ensure_role(Role.VIEWER)
    address = getattr(request, "address")
    coll = _users_collection()
    doc = coll.find_one({"address": address})
    if not doc or not doc.get("sharing_pubkey"):
        abort(404, "public key not set")
    coll.update_one({"address": address}, {"$set": {"sharing_pubkey": None}})
    return {"status": "deleted"}
