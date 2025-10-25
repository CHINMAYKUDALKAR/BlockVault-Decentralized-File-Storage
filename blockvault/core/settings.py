from __future__ import annotations

"""Dynamic (runtime) configuration overrides stored in the database.

Allows updating contract addresses through an admin API instead of relying
solely on environment variables. Addresses updated here are merged into
Flask app.config immediately for subsequent requests.
"""
from typing import Any, Dict


_DOC_ID = "global"


def _coll():  # legacy stub
    from .db import get_db
    return get_db()["settings"]


def get_settings() -> Dict[str, Any]:
    doc = _coll().find_one({"_id": _DOC_ID}) or {"_id": _DOC_ID}
    return doc


def update_settings(**kwargs) -> Dict[str, Any]:  # compatibility no-op
    return get_settings()


def bootstrap_settings_into_config() -> None:  # no-op after RBAC removal
    return None