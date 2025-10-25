from __future__ import annotations
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Config:
    env: str
    debug: bool
    mongo_uri: str
    secret_key: str
    jwt_secret: str
    jwt_exp_minutes: int
    ipfs_api_url: str | None = None
    ipfs_api_token: str | None = None
    ipfs_enabled: bool = False
    ipfs_gateway_url: str | None = None
    eth_rpc_url: str | None = None
    eth_private_key: str | None = None
    # Legacy on-chain RBAC removed; keep placeholders for backward compat (always None)
    role_registry_address: str | None = None
    file_access_contract: str | None = None
    file_registry_address: str | None = None  # new on-chain file registry (optional)
    cors_allowed_origins: str | None = None
    app_name: str = "BlockVault"
    access_manager_address: str | None = None  # deprecated (kept for backward compatibility, always None)


def load_config() -> Config:
    env = os.getenv("FLASK_ENV", "development")
    debug = env != "production"
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/blockvault")
    secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change")
    jwt_secret = os.getenv("JWT_SECRET", "dev-jwt-secret-change")
    jwt_exp_minutes = int(os.getenv("JWT_EXP_MINUTES", "60"))
    ipfs_api_url = os.getenv("IPFS_API_URL")
    ipfs_api_token = os.getenv("IPFS_API_TOKEN")
    ipfs_enabled = os.getenv("IPFS_ENABLED", "false").lower() in {"1", "true", "yes"}
    ipfs_gateway_url = os.getenv("IPFS_GATEWAY_URL")
    eth_rpc_url = os.getenv("ETH_RPC_URL")
    eth_private_key = os.getenv("ETH_PRIVATE_KEY")
    role_registry_address = None
    file_access_contract = None
    cors_allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS")
    file_registry_address = os.getenv("FILE_REGISTRY_ADDRESS")
    access_manager_address = None  # removed feature; ignore env/manifest
    return Config(
        env=env,
        debug=debug,
        mongo_uri=mongo_uri,
        secret_key=secret_key,
        jwt_secret=jwt_secret,
        jwt_exp_minutes=jwt_exp_minutes,
        ipfs_api_url=ipfs_api_url,
        ipfs_api_token=ipfs_api_token,
        ipfs_enabled=ipfs_enabled,
        ipfs_gateway_url=ipfs_gateway_url,
        eth_rpc_url=eth_rpc_url,
        eth_private_key=eth_private_key,
        role_registry_address=role_registry_address,
        file_access_contract=file_access_contract,
        file_registry_address=file_registry_address,
        cors_allowed_origins=cors_allowed_origins,
        access_manager_address=access_manager_address,
    )
