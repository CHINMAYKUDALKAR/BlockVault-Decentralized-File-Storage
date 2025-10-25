from __future__ import annotations
import os
from pathlib import Path
from typing import Optional, Dict, Any
import base64
import json
import logging
import requests
from flask import current_app

_client = None  # lazy IPFS daemon client (for multiaddr usage)
logger = logging.getLogger(__name__)


def _is_http_mode(api_url: str) -> bool:
    return api_url.startswith("http://") or api_url.startswith("https://")


def _http_headers() -> Dict[str, str]:
    headers: Dict[str, str] = {}
    token = current_app.config.get("IPFS_API_TOKEN")
    if not token:
        return headers
    # Heuristic: If token contains a colon, treat as basic auth (Infura style project_id:project_secret)
    if ":" in token:
        b64 = base64.b64encode(token.encode()).decode()
        headers["Authorization"] = f"Basic {b64}"
    else:
        # Assume bearer (e.g., Pinata JWT API key)
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _get_client():
    global _client
    if _client is not None:
        return _client
    import ipfshttpclient  # type: ignore
    api_url = current_app.config.get("IPFS_API_URL") or "/dns/localhost/tcp/5001/http"
    if _is_http_mode(api_url):
        # In HTTP provider mode we don't use ipfshttpclient; return a sentinel
        return None
    _client = ipfshttpclient.connect(api_url)
    return _client


def ipfs_enabled() -> bool:
    return bool(current_app.config.get("IPFS_ENABLED"))


def add_file(path: Path, pin: bool = True) -> Optional[str]:
    if not ipfs_enabled():
        return None
    api_url = current_app.config.get("IPFS_API_URL") or "/dns/localhost/tcp/5001/http"
    try:
        if _is_http_mode(api_url):
            # HTTP API: POST /api/v0/add
            add_endpoint = api_url.rstrip("/") + "/api/v0/add"
            with open(path, "rb") as f:
                files = {"file": (path.name, f)}
                params = {"pin": str(pin).lower()}
                resp = requests.post(add_endpoint, headers=_http_headers(), files=files, params=params, timeout=60)
            resp.raise_for_status()
            data: Dict[str, Any] = resp.json()
            return data.get("Hash")
        # Multiaddr client mode
        client = _get_client()
        if client is None:
            return None
        result = client.add(str(path), pin=pin)  # type: ignore
        if isinstance(result, list):
            for item in reversed(result):
                if "Hash" in item:
                    return item["Hash"]
            return None
        return result.get("Hash")  # type: ignore[union-attr]
    except Exception as e:
        logger.warning("IPFS add failed: %s", e)
        return None


def cat_to_path(cid: str, out_path: Path) -> None:
    api_url = current_app.config.get("IPFS_API_URL") or "/dns/localhost/tcp/5001/http"
    if _is_http_mode(api_url):
        cat_endpoint = api_url.rstrip("/") + "/api/v0/cat"
        resp = requests.post(cat_endpoint, headers=_http_headers(), params={"arg": cid}, timeout=60)
        resp.raise_for_status()
        data = resp.content
        with open(out_path, "wb") as f:
            f.write(data)
        return
    client = _get_client()
    if client is None:
        raise RuntimeError("No IPFS client available")
    data = client.cat(cid)  # type: ignore
    with open(out_path, "wb") as f:
        f.write(data)


def gateway_url(cid: str) -> Optional[str]:
    gw = current_app.config.get("IPFS_GATEWAY_URL")
    if not gw:
        # default public gateway
        gw = "https://ipfs.io/ipfs"
    return f"{gw.rstrip('/')}/{cid}"


def unpin(cid: str) -> bool:
    """Best-effort unpin of a CID.

    Supports both:
      * Multiaddr daemon via ipfshttpclient (pin.rm)
      * HTTP API providers (/api/v0/pin/rm)
      * Pinata / gateway style token-auth endpoints (Authorization header)
    Returns True if request appeared successful, False otherwise.
    """
    if not cid:
        return False
    if not ipfs_enabled():
        return False
    api_url = current_app.config.get("IPFS_API_URL") or "/dns/localhost/tcp/5001/http"
    try:
        if _is_http_mode(api_url):
            # HTTP API: POST /api/v0/pin/rm?arg=<cid>
            endpoint = api_url.rstrip('/') + '/api/v0/pin/rm'
            resp = requests.post(endpoint, headers=_http_headers(), params={'arg': cid, 'recursive': 'true'}, timeout=30)
            # Some providers return non-200 if already unpinned; treat 200/400 gracefully
            if resp.status_code in (200, 400, 404):
                return True
            return False
        client = _get_client()
        if client is None:
            return False
        try:  # type: ignore[attr-defined]
            client.pin.rm(cid)  # type: ignore
            return True
        except Exception:
            return False
    except Exception as e:
        logger.warning("IPFS unpin failed: %s", e)
        return False
