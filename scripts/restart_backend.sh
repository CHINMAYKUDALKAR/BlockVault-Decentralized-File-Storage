#!/usr/bin/env bash
# Helper to reliably restart the BlockVault backend on port 5000.
# Kills any existing process bound to the port, sets common dev env vars,
# activates venv, and launches the stable runner (no reloader).
set -euo pipefail
PORT=${PORT:-5000}
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

if command -v fuser >/dev/null 2>&1; then
  if fuser ${PORT}/tcp >/dev/null 2>&1; then
    echo "[restart] Killing existing process on port ${PORT}" >&2
    fuser -k ${PORT}/tcp >/dev/null 2>&1 || true
    sleep 1
  else
    echo "[restart] No existing process on port ${PORT}" >&2
  fi
else
  echo "[restart] fuser not found; skipping port kill check" >&2
fi

if [ ! -d .venv ]; then
  echo "[restart] Creating virtual environment (.venv)" >&2
  python -m venv .venv
fi
source .venv/bin/activate

if [ -f requirements.txt ]; then
  # Cheap check: ensure flask installed; if not, install requirements.
  python - <<'PY' 2>/dev/null || INSTALL=1
try:
    import flask  # noqa
except Exception:
    raise SystemExit(1)
PY
  if [ "${INSTALL:-0}" = "1" ]; then
    echo "[restart] Installing dependencies" >&2
    pip install -q -r requirements.txt
  fi
fi

export ALLOW_DEV_TOKEN=${ALLOW_DEV_TOKEN:-1}
export MONGO_URI=${MONGO_URI:-mongodb://localhost:27017/blockvault}

echo "[restart] Starting backend with ALLOW_DEV_TOKEN=$ALLOW_DEV_TOKEN MONGO_URI=$MONGO_URI" >&2
exec python scripts/run_backend.py
