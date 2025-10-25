# Contracts

## FileRegistry.sol
A minimal solidity contract used optionally by the BlockVault backend to anchor file metadata:

```
anchorFile(bytes32 fileHash, uint256 size, string cid)
```

- `fileHash`: sha256 of plaintext file (32 bytes)
- `size`: original size in bytes
- `cid`: optional IPFS CID (empty string if not using IPFS)

The contract stores a single immutable record (size, cid, timestamp, submitter) keyed by the sha256 hash. Re-anchoring the same hash is rejected. Events allow indexers or explorers to build an immutable timeline of uploads.

## Deployment (Hardhat Quickstart)

```bash
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
# Drop FileRegistry.sol into contracts/
# Add deployment script similar to below.
```

Example deployment script `scripts/deploy.ts`:

```ts
import { ethers } from "hardhat";

async function main() {
  const FileRegistry = await ethers.getContractFactory("FileRegistry");
  const reg = await FileRegistry.deploy();
  await reg.waitForDeployment();
  console.log("FileRegistry deployed:", await reg.getAddress());
}

main().catch((e)=>{ console.error(e); process.exit(1); });
```

Then:
```bash
npx hardhat compile
npx hardhat deploy --network <your-network>
```

Set the resulting address in environment:
```
FILE_REGISTRY_ADDRESS=0x...
ETH_RPC_URL=https://...
ETH_PRIVATE_KEY=0x<priv>
```

Once configured, backend uploads will emit `FileAnchored` transactions.
