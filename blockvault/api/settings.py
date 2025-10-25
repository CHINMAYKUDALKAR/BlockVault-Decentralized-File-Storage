from __future__ import annotations

from flask import Blueprint, request, abort
from ..core.security import require_auth
from ..core.settings import get_settings, update_settings

bp = Blueprint("settings", __name__)


@bp.get("/")
@require_auth
def read_settings():  # type: ignore
    get_settings()  # legacy dynamic settings ignored now
    return {}

# /settings/access-manager endpoint removed (on-chain access control deprecated)


def _validate_addr(label: str, val: str | None) -> str | None:  # retained for future extension
    return None


@bp.post("/")
@require_auth
def write_settings():  # type: ignore
    data = request.get_json(silent=True) or {}
    update_settings()
    return {"updated": True}


@bp.post('/import-manifest')
@require_auth
def import_manifest():  # type: ignore
    return {"imported": False, "note": "on-chain access control removed"}