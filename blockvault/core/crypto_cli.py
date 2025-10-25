from __future__ import annotations
import os
import shutil
import subprocess
import uuid
from pathlib import Path
from typing import Optional

from flask import current_app


def _resolve_binary() -> str:
    env_path = os.getenv("BLOCKVAULT_CRYPTO_BIN")
    if env_path and os.path.isfile(env_path) and os.access(env_path, os.X_OK):
        return env_path
    candidate_paths = [
        "blockvault_crypto/target/release/blockvault_crypto",
        "blockvault_crypto/target/debug/blockvault_crypto",
    ]
    for p in candidate_paths:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    if shutil.which("cargo"):
        subprocess.run(
            ["cargo", "build", "--release"],
            cwd="blockvault_crypto",
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        built = "blockvault_crypto/target/release/blockvault_crypto"
        if os.path.isfile(built):
            return built
    raise FileNotFoundError(
        "blockvault_crypto binary not found. Build it or set BLOCKVAULT_CRYPTO_BIN."
    )


def encrypt_file(plain_path: Path, encrypted_path: Path, key: str, aad: Optional[str]) -> None:
    bin_path = _resolve_binary()
    cmd = [
        bin_path,
        "encrypt",
        "--input",
        str(plain_path),
        "--output",
        str(encrypted_path),
        "--key",
        key,
    ]
    if aad:
        cmd += ["--aad", aad]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"Encryption failed: {res.stderr.decode()}")


def decrypt_file(encrypted_path: Path, output_path: Path, key: str, aad: Optional[str]) -> None:
    bin_path = _resolve_binary()
    cmd = [
        bin_path,
        "decrypt",
        "--input",
        str(encrypted_path),
        "--output",
        str(output_path),
        "--key",
        key,
    ]
    if aad:
        cmd += ["--aad", aad]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode != 0:
        raise RuntimeError(f"Decryption failed: {res.stderr.decode()}")


def ensure_storage_dir() -> Path:
    base = current_app.config.get("FILE_STORAGE_DIR", "storage")
    path = Path(base)
    path.mkdir(parents=True, exist_ok=True)
    return path


def generate_encrypted_filename() -> str:
    return f"enc_{uuid.uuid4().hex}.bin"
