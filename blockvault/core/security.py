from __future__ import annotations
import time
import jwt
from flask import current_app, request, abort
from functools import wraps
from typing import Any, Dict, Callable, TypeVar, cast

"""Simplified security utilities (on-chain RBAC removed).

Previously the system attached dynamic roles (viewer/owner/admin) resolved via
an on-chain RoleRegistry contract. All that logic has been removed for the
off‑chain edition. For now, every authenticated address is implicitly treated
as an OWNER for file operations; selective sharing still governs access to
non-owned files via explicit share records.

If you later reintroduce granular roles, add a lightweight role resolver and
decorate endpoints accordingly.
"""

from typing import Any as _Any  # avoid unused import lint complaints

def _attach_default_role(address: str) -> None:
    """Attach a default implicit role to the request context.

    We mimic the old interface (setting request.role) so existing endpoint code
    that references request.role / role_name keeps functioning without change.
    Role numeric values kept for minimal compatibility: OWNER = 2.
    """
    from flask import request as _req
    _req.role = 2  # OWNER
    _req.role_name = "owner"


def generate_jwt(payload: Dict[str, Any]) -> str:
    secret = current_app.config["JWT_SECRET"]
    exp_minutes = current_app.config.get("JWT_EXP_MINUTES", 60)
    now = int(time.time())
    to_encode = {"iat": now, "exp": now + exp_minutes * 60, **payload}
    return jwt.encode(to_encode, secret, algorithm="HS256")


def verify_jwt(token: str) -> Dict[str, Any]:
    secret = current_app.config["JWT_SECRET"]
    return jwt.decode(token, secret, algorithms=["HS256"])  # type: ignore

F = TypeVar("F", bound=Callable[..., Any])


def require_auth(fn: F) -> F:
    """Decorator to enforce JWT auth using Authorization: Bearer <token>. Sets request.address."""

    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            abort(401, "missing bearer token")
        token = auth_header.removeprefix("Bearer ").strip()
        if not token:
            abort(401, "empty token")
        try:
            decoded = verify_jwt(token)
        except jwt.ExpiredSignatureError:
            abort(401, "token expired")
        except jwt.InvalidTokenError:
            abort(401, "invalid token")
        sub = decoded.get("sub")
        if not sub:
            abort(401, "invalid subject")
        # Attach to request context (not thread safe across greenlets, but fine here)
        request.address = sub  # type: ignore[attr-defined]
        _attach_default_role(sub)
        return fn(*args, **kwargs)

    return cast(F, wrapper)
