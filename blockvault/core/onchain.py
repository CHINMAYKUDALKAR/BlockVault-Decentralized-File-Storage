from __future__ import annotations
"""Lightweight optional on-chain anchoring utilities.

This module lets the backend emit a transaction (or simulated hash) anchoring
an uploaded file's metadata (sha256, size, optional IPFS CID) to a simple
FileRegistry contract. If a contract address or RPC URL / private key are
missing, functions gracefully no-op.
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
import os
import json
import time
import logging

from flask import current_app

logger = logging.getLogger(__name__)

try:
    from web3 import Web3  # type: ignore
except ImportError:  # backend may not have web3 installed yet
    Web3 = None  # type: ignore

FILE_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "fileHash", "type": "bytes32"},
            {"internalType": "uint256", "name": "size", "type": "uint256"},
            {"internalType": "string", "name": "cid", "type": "string"},
        ],
        "name": "anchorFile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def enabled() -> bool:
    cfg = current_app.config
    return bool(
        cfg.get("ETH_RPC_URL")
        and cfg.get("ETH_PRIVATE_KEY")
        and cfg.get("FILE_REGISTRY_ADDRESS")
        and Web3 is not None
    )


def _w3() -> Optional[Any]:  # pragma: no cover - simple accessor
    if not enabled():
        return None
    try:
        return Web3(Web3.HTTPProvider(current_app.config.get("ETH_RPC_URL")))  # type: ignore[arg-type]
    except Exception as e:
        logger.warning("web3 init failed: %s", e)
        return None


def anchor_file(hash_hex: str, size: int, cid: Optional[str]) -> Optional[str]:
    """Anchor file metadata on-chain.

    Returns transaction hash (hex) or a simulated hash when disabled.
    """
    if not hash_hex or len(hash_hex) != 64:
        logger.debug("anchor_file: invalid hash %s", hash_hex)
        return None
    if not enabled():
        # Return deterministic pseudo-hash for traceability even when disabled
        pseudo = f"simulated::{hash_hex[:16]}::{size}"
        return pseudo
    try:
        w3 = _w3()
        if w3 is None:
            return None
        acct = w3.eth.account.from_key(current_app.config.get("ETH_PRIVATE_KEY"))  # type: ignore
        contract_addr = current_app.config.get("FILE_REGISTRY_ADDRESS")
        contract = w3.eth.contract(address=Web3.to_checksum_address(contract_addr), abi=FILE_REGISTRY_ABI)  # type: ignore
        file_hash_bytes = bytes.fromhex(hash_hex)
        # bytes32 => first 32 bytes (sha256 already 32)
        nonce = w3.eth.get_transaction_count(acct.address)
        txn = contract.functions.anchorFile(file_hash_bytes, int(size), cid or "").build_transaction({
            "from": acct.address,
            "nonce": nonce,
            "gas": 180000,
            "maxFeePerGas": w3.to_wei('30', 'gwei'),
            "maxPriorityFeePerGas": w3.to_wei('1', 'gwei'),
            "chainId": w3.eth.chain_id,
        })
        signed = acct.sign_transaction(txn)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt_hash = tx_hash.hex()
        logger.info("Anchored file sha256=%s size=%s cid=%s tx=%s", hash_hex, size, cid, receipt_hash)
        return receipt_hash
    except Exception as e:
        logger.warning("anchor_file failed: %s", e)
        return None