# BlockVault – Encrypted File Vault (Off‑Chain Simplified Edition)

This edition removes legacy on‑chain role / access control logic and wallet network coupling. Core functionality now focuses on:

* Local (or MongoDB) metadata storage
* AES‑GCM client‑side encryption with user‑provided passphrases
* Optional RSA public key registration + encrypted share distribution
* Clean React UI for upload, preview, verify, share, and download flows

* All legacy RBAC contracts removed. An optional light on-chain anchoring layer (FileRegistry) can record file hashes + CIDs for auditability without reintroducing access gating.

---

## Feature Highlights

- **JWT Auth (Optional Wallet Signature)** – You can keep a simple address + dev token flow; full signature login can be disabled.
- **RSA‑Based Sharing** – Register PEM public keys; passphrases delivered encrypted per recipient.
- **Encrypted Files** – Client encrypts before upload, server never sees plaintext.
- **Share Management APIs** – Create, list, revoke encrypted passphrase shares.
- **Optional IPFS Integration** – Configure pinning + gateway if desired.
- **Lightweight UI** – Network / on‑chain role controls removed.

---

## Repository Layout

```
BlockVault/
├── blockvault/                 # Flask application package
│   ├── api/                    # Auth, file, and user blueprints
│   ├── core/                   # Config, security, RBAC, crypto helper
│   └── __init__.py             # App factory registering routes & CORS
├── blockvault-frontend/        # React single page app
├── .env.example                # Reference environment configuration
├── pyproject.toml / requirements.txt
└── README.md
```

---

## Getting Started

### 1. Clone & Environment

```bash
# clone & enter
git clone https://github.com/ScriptXDemon/BlockVault.git
cd BlockVault

# create Python virtualenv
python -m venv .venv
source .venv/bin/activate

# install backend dependencies
pip install -e .[dev]

# copy environment template
cp .env.example .env
# edit .env with your secrets and Mongo URI (no contract addresses needed)
```

_Key environment variables_

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Mongo connection string (`memory://` for in-memory dev) |
| `SECRET_KEY` / `JWT_SECRET` | Flask & JWT secrets |
| `ETH_RPC_URL` | (Optional) Only needed if reintroducing blockchain features |
| `ETH_RPC_URL` | (Optional) Needed for on-chain anchoring |
| `ETH_PRIVATE_KEY` | (Optional) Deployer/signing key for anchoring txs |
| `FILE_REGISTRY_ADDRESS` | (Optional) Deployed FileRegistry contract address |
| `ROLE_REGISTRY_ADDRESS` | (Deprecated) Ignored |
| `FILE_ACCESS_CONTRACT` | (Deprecated) Ignored |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins (or `*` for dev) |
| `IPFS_ENABLED` / `IPFS_API_URL` | Optional IPFS pinning configuration |
| `ALLOW_DEV_TOKEN` | Set to `1` in dev to use `/auth/dev_token` shortcut |

### 2. Run the Backend

```bash
# from repo root
export FLASK_ENV=development
python -m blockvault.app
```

- **Mongo optional:** In-memory storage works for quick tests but resets on restart. Use Docker (`docker compose up -d mongo`) for persistence.
- **Dev convenience:** With `ALLOW_DEV_TOKEN=1`, retrieve a JWT without signing: `curl "http://localhost:5000/auth/dev_token?address=0xYourWallet"`.

### 3. Run the Frontend

```bash
cd blockvault-frontend
npm install
npm start
```

The SPA expects `REACT_APP_API_BASE` (optional). By default it assumes the API is reachable via the same origin proxy.

---

## API Overview

| Endpoint | Method | Role | Description |
| --- | --- | --- | --- |
| `/auth/get_nonce` | POST | public | Issue login nonce for wallet signature |
| `/auth/login` | POST | public | Verify signature → JWT |
| `/auth/me` | GET | any | Returns stored address / identity info |
| `/files` | POST | owner | Upload encrypted file (AES-256-GCM CLI helper) |
| `/files` | GET | owner | List your files (supports `limit`/`after`) |
| `/files/<id>` | GET | owner/viewer | Download (requires passphrase) |
| `/files/<id>` | DELETE | owner | Remove file + shares |
| `/files/<id>/verify` | GET | owner | Confirms encrypted blob exists |
| `/files/<id>/share` | POST | owner | Encrypt passphrase to recipient RSA key |
| `/files/shared` | GET | viewer | Shares sent to you (with encrypted key) |
| `/files/shares/outgoing` | GET | owner | Shares you granted |
| `/files/shares/<id>` | DELETE | owner/admin | Revoke share |
| `/users/profile` | GET | viewer | Role info + sharing key status (add `?with_key=1` for PEM) |
| `/users/public_key` | POST/DELETE | viewer | Register/remove RSA public key |
| `/health` | GET | public | Liveness probe |

All authenticated routes require `Authorization: Bearer <jwt>`.

---

## Sharing Workflow

1. **Recipient registers RSA key**
   - Generate keypair (`openssl genrsa -out key.pem 4096`, then export public key: `openssl rsa -in key.pem -pubout -out pub.pem`).
   - Paste the PEM into the Sharing Center UI or call `POST /users/public_key`.
2. **Owner uploads & shares**
   - Upload a file with a strong passphrase (stored client-side only).
   - Click **Share** on the file, supply recipient address, optional note, optional expiration (`datetime-local`), and the passphrase.
   - The backend encrypts the passphrase with the recipient’s RSA key.
3. **Recipient consumes share**
   - Open Sharing Center → **Shares received** → copy the `encrypted_key`.
   - Decrypt using their RSA private key (`openssl rsautl -decrypt ...`).
   - Use decrypted passphrase to download via the UI (or `GET /files/<id>`).
4. **Revocation**
   - Owners can revoke any outgoing share; admins can revoke on behalf of others via `/files/shares/<id>`.

---

## Optional On‑Chain Anchoring Layer

You may deploy a minimal `FileRegistry` contract that exposes:

```
function anchorFile(bytes32 fileHash, uint256 size, string cid) external
```

When `ETH_RPC_URL`, `ETH_PRIVATE_KEY`, and `FILE_REGISTRY_ADDRESS` are supplied, uploads will attempt to send a transaction calling `anchorFile` with:

* `fileHash`: sha256 (32 bytes) of the original plaintext
* `size`: original size in bytes
* `cid`: IPFS CID if available (empty string otherwise)

Response objects then include `anchor_tx` (transaction hash or a simulated tag when anchoring disabled). Listing endpoints also surface `anchor_tx`.

Anchoring failures are non-fatal and logged; upload still succeeds locally/IPFS.

Security note: Only include the sha256 if you are comfortable revealing file integrity fingerprints publicly (could aid confirmation of possession for known documents). For stronger privacy keep anchoring disabled or salt/transform future variants.

All Solidity contracts, manifests, and role enforcement layers were removed. If you want to restore them later:
1. Recreate a `contracts/` folder and add Solidity sources.
2. Reintroduce Hardhat (or Foundry) tooling.
3. Expose the deployed addresses through environment variables.
4. Rebuild frontend wallet + network UI.

Until then, access control is purely off‑chain: possession of a file ID + decrypted passphrase = access.

---

## Frontend Highlights

- **Network activity bar:** Tracks concurrent API calls via `useNetworkStore` (purely HTTP now).
- **Upload card:** Drag & drop, passphrase + optional AAD fields, in-app toast notifications, and custom event to refresh listings.
- **Files card:** Inline actions (download, share, verify, delete), copy CID/SHA, download modal requiring passphrase entry.
- **Sharing Center:**
  - Key management with PEM textarea + quick status badge.
  - Incoming shares list with metadata, note, encrypted key copy helper.
  - Outgoing shares grid with revoke action.

---

## Testing & Validation

### Automated

```bash
# backend tests (if/when added)
pytest -q
```

### Manual Smoke (recommended after each deployment)

1. **Auth (Optional)** – Use dev token flow or simplified address login.
2. **Upload & Verify** – Upload file; verify integrity endpoint.
3. **Share Cycle** – Share passphrase → recipient decrypts → downloads file.
4. **Revocation** – Revoke share and confirm it's removed from recipient list.
5. **CORS** – Confirm API accessible from deployed origin.

---

## Deployment Notes

- **Backend (Flask):** Suitable for Render, Railway, Fly.io, or Heroku. Run via `gunicorn blockvault.app:create_app()` and configure environment variables in the hosting dashboard. Mount persistent storage or connect to Atlas for MongoDB.
- **Frontend (React):** Deploy to Netlify, Vercel, or static S3 hosting. Configure `REACT_APP_API_BASE` to the backend URL and ensure the backend’s `CORS_ALLOWED_ORIGINS` includes the deployed origin.
- **Secrets Management:** Never commit `.env`. For production, rotate JWT and Flask secrets and supply a production-grade MongoDB connection string.
- **Monitoring:** Tail `backend.log` (or platform logs) for RBAC cache warnings and IPFS failures. Consider wrapping endpoints with structured logging before launch.

### Chain / Manifest Features

Removed. `/settings/import-manifest` now returns a placeholder response if invoked.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| `nonce expired` | Slow login flow | Request new nonce (`/auth/get_nonce`) |
| `missing bearer token` | Frontend lost JWT | Re-login; ensure toast host shows success |
| `recipient has not registered a sharing public key` | Recipient skipped key upload | Have them POST `/users/public_key` |
| Shares disappear after restart | Using memory DB | Switch to MongoDB instance |
| `RBAC contract not configured` warning | Legacy log line (if any remains) | Safe to ignore (feature removed) |

---

Happy hacking! This simplified edition focuses on core encrypted storage and sharing—add blockchain layers only if they add real value.
