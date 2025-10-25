from __future__ import annotations
from flask import Flask, current_app, g
from pymongo import MongoClient
import logging
from .memory_db import get_memory_db, MemoryDB
from typing import Optional

CLIENT_KEY = "_mongo_client"
DB_NAME = "blockvault"


def init_db(app: Flask) -> None:
    @app.before_request
    def _before_request():  # type: ignore
        if CLIENT_KEY not in g:
            uri = app.config.get("MONGO_URI")
            if isinstance(uri, str) and uri.startswith("memory://"):
                # Use in-memory singleton DB
                g._mongo_db = get_memory_db()  # type: ignore[attr-defined]
            else:
                try:
                    # Use a short timeout so a missing Mongo doesn't stall requests
                    g._mongo_client = MongoClient(uri, serverSelectionTimeoutMS=300)  # type: ignore[attr-defined]
                    # Force a quick server selection to detect absence
                    try:
                        g._mongo_client.admin.command("ping")  # type: ignore[attr-defined]
                    except Exception as e:
                        raise RuntimeError(f"Mongo unreachable: {e}")
                    default_db = g._mongo_client.get_default_database()  # type: ignore[attr-defined]
                    if default_db is not None:
                        g._mongo_db = default_db  # type: ignore[attr-defined]
                    else:
                        g._mongo_db = g._mongo_client[DB_NAME]  # type: ignore[attr-defined]
                except Exception as e:
                    logging.getLogger(__name__).warning(
                        "Falling back to in-memory DB because Mongo connection failed: %s", e
                    )
                    g._mongo_db = get_memory_db()  # type: ignore[attr-defined]

    @app.teardown_appcontext
    def close_connection(exception: Optional[BaseException]):  # type: ignore
        client = getattr(g, CLIENT_KEY, None)
        if client is not None:
            client.close()


def get_db():
    if getattr(g, "_mongo_db", None) is None:
        init_db(current_app)
    return g._mongo_db  # type: ignore[attr-defined]
