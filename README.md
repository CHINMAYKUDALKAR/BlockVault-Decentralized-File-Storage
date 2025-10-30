# 🔐 BlockVault - Secure File Storage & Legal Document Management

<div align="center">

![BlockVault](https://img.shields.io/badge/BlockVault-v2.0-6366f1?style=for-the-badge)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-627eea?style=for-the-badge)
![ZK-Proofs](https://img.shields.io/badge/ZK--Proofs-Enabled-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.9+-3776ab?style=for-the-badge)

**Enterprise-grade decentralized file storage with zero-knowledge proofs and blockchain verification**

Made with ❤️ in India 🇮🇳

[Features](#-features) • [Installation](#-installation) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

BlockVault is a cutting-edge decentralized application (dApp) that combines secure file storage with advanced legal document management capabilities. Built on Ethereum with zero-knowledge proof technology, it provides enterprise-level security while maintaining complete user privacy.

### 🎯 Key Highlights

- **🔒 End-to-End Encryption** - Military-grade AES-256 encryption
- **🌐 Decentralized Storage** - IPFS integration for distributed file storage
- **⚖️ Legal Document Management** - Smart contract-based document lifecycle
- **🤖 AI-Powered Analysis** - ZKML (Zero-Knowledge Machine Learning) document analysis
- **🔐 Zero-Knowledge Proofs** - ZKPT for verifiable document redaction
- **👥 Role-Based Access Control** - Granular permission management
- **📜 Blockchain Verification** - Immutable chain of custody
- **💼 Multi-Signature Support** - Secure document signing workflows

---

## ✨ Features

### 📁 File Management
- **Secure Upload** - Encrypted file upload with IPFS storage
- **Version Control** - Track document versions with blockchain timestamps
- **Share & Collaborate** - Time-limited, password-protected file sharing
- **Advanced Search** - Full-text search with filters and sorting
- **Bulk Operations** - Multi-file upload, download, and deletion

### ⚖️ Legal Document Management
- **Document Notarization** - Blockchain-anchored document registration
- **Verifiable Redaction (ZKPT)** - Prove redactions without revealing content
- **AI Document Analysis (ZKML)** - Extract insights with cryptographic proofs
- **Multi-Party Signatures** - Collect signatures with escrow support
- **Case Management** - Organize documents by legal cases
- **Chain of Custody** - Complete audit trail with blockchain verification
- **Role-Based Permissions** - Lead Attorney, Associate, Paralegal, Client, External Counsel

### 🔐 Security Features
- **Wallet Authentication** - MetaMask & WalletConnect integration
- **RSA Key Encryption** - Client-side key generation and management
- **Passphrase Protection** - Additional layer for sensitive files
- **Access Revocation** - Instantly revoke document access
- **Emergency Pause** - Contract-level emergency stop mechanism
- **Escrow Refunds** - Automatic refund for expired signature requests

### 🎨 User Experience
- **Modern UI/UX** - Premium glassmorphism design
- **Light/Dark Mode** - Seamless theme switching
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Keyboard Shortcuts** - Power-user productivity features
- **Real-time Updates** - Live status indicators and notifications
- **Smooth Animations** - 60fps hardware-accelerated transitions

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Ethers.js v6** - Ethereum interactions
- **React Router** - Client-side routing
- **React Hot Toast** - Beautiful notifications

#### Backend
- **Flask** - Python web framework
- **MongoDB** - NoSQL database
- **IPFS** - Distributed file storage
- **JWT** - Secure authentication
- **Cryptography** - RSA & AES encryption

#### Blockchain
- **Solidity 0.8.x** - Smart contract language
- **Hardhat** - Development environment
- **OpenZeppelin** - Audited contract libraries
- **Ethereum** - Blockchain platform

#### ML/AI (Optional)
- **TensorFlow** - ML model training
- **ONNX Runtime** - Model inference
- **Zero-Knowledge ML** - Privacy-preserving AI

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Files   │  │  Legal   │  │  Auth    │  │  Theme  ││
│  │Dashboard │  │Dashboard │  │ Context  │  │ Context ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────────┘│
└───────┼─────────────┼─────────────┼──────────────────────┘
        │             │             │
        ├─────────────┼─────────────┤
        │             │             │
┌───────▼─────────────▼─────────────▼──────────────────────┐
│                Backend API (Flask)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Files   │  │  Legal   │  │   IPFS   │  │  Auth   ││
│  │ Endpoints│  │Endpoints │  │Integration│  │ JWT    ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘│
└───────┼─────────────┼─────────────┼──────────────┼──────┘
        │             │             │              │
        ├─────────────┼─────────────┼──────────────┤
        │             │             │              │
┌───────▼─────────────▼─────────────▼──────────────▼──────┐
│                Storage & Blockchain                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ MongoDB  │  │   IPFS   │  │ Ethereum │  │  RSA    ││
│  │(Metadata)│  │  (Files) │  │  (Smart  │  │  Keys   ││
│  │          │  │          │  │Contracts)│  │         ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** 16.x or higher
- **Python** 3.9 or higher
- **MongoDB** 4.4 or higher
- **IPFS Desktop** or Kubo CLI
- **MetaMask** browser extension
- **Git**

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/BlockVault.git
cd BlockVault
```

### Step 2: Backend Setup

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start MongoDB (if not running)
# MongoDB should be running on mongodb://localhost:27017

# Start IPFS daemon
ipfs daemon

# Run backend server
cd backend
python app.py
```

The backend will start on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
# Install Node dependencies
cd blockvault-frontend
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

### Step 4: Smart Contract Deployment

```bash
# Install Hardhat dependencies
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Deploy to local network
npx hardhat node  # In separate terminal
npx hardhat run scripts/deploy.js --network localhost

# Copy contract address and ABI to frontend config
```

### Step 5: Environment Configuration

Create `.env` files in both backend and frontend:

**Backend `.env`:**
```env
MONGODB_URI=mongodb://localhost:27017/blockvault
IPFS_API_URL=http://127.0.0.1:5001
JWT_SECRET=your-secure-jwt-secret-key-change-this
FLASK_ENV=development
```

**Frontend `.env`:**
```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_CONTRACT_ADDRESS=<your-deployed-contract-address>
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## 📖 Usage

### Connecting Wallet

1. Install MetaMask browser extension
2. Create or import an Ethereum wallet
3. Visit `http://localhost:3000`
4. Click "Connect Wallet" button
5. Approve the connection in MetaMask

### Uploading Files

1. Navigate to "Files" tab
2. Click "Upload File" button
3. Select file(s) from your computer
4. Optionally add passphrase protection
5. Wait for encryption and IPFS upload
6. File metadata stored in MongoDB, encrypted file in IPFS

### Legal Document Management

1. Navigate to "Legal" tab
2. Click "Connect Wallet" if not authenticated
3. Complete onboarding (select role and firm name)
4. Click "Notarize Document" to register on blockchain
5. Use advanced features:
   - **Redaction**: Create verifiable redactions with ZKPT
   - **AI Analysis**: Analyze documents with ZKML
   - **Signatures**: Request multi-party signatures with escrow
   - **Case Management**: Organize documents by cases

### Sharing Files

1. Find file in "My Files" tab
2. Click "Share" icon
3. Enter recipient's Ethereum address
4. Set expiration time (optional)
5. Add password protection (optional)
6. Click "Share File"
7. Share the passphrase with recipient securely

---

## 🔒 Security

### Smart Contract Security

- **OpenZeppelin Libraries** - Audited contract components
- **Custom Errors** - Gas-optimized error handling
- **ReentrancyGuard** - Protection against reentrancy attacks
- **Pausable** - Emergency stop mechanism
- **Access Control** - Role-based permissions
- **Input Validation** - Comprehensive parameter checking
- **Escrow System** - Secure fund management

### Cryptography

- **AES-256-GCM** - File encryption
- **RSA-2048** - Key encryption
- **PBKDF2** - Password derivation
- **SHA-256** - Hashing
- **HMAC** - Message authentication

### Best Practices

- ✅ Never commit `.env` files
- ✅ Use hardware wallets for production
- ✅ Regular security audits
- ✅ Keep dependencies updated
- ✅ Enable 2FA on all accounts
- ✅ Use strong passphrases
- ✅ Verify contract addresses

---

## 🧪 Testing

### Frontend Tests
```bash
cd blockvault-frontend
npm test
```

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Smart Contract Tests
```bash
cd contracts
npx hardhat test
npx hardhat coverage
```

---

## 📊 Smart Contract Details

### BlockVaultLegal.sol

**Key Functions:**
- `registerDocument(bytes32 docHash, ...)` - Register document on blockchain
- `grantAccess(bytes32 docHash, address user)` - Grant document access
- `revokeAccess(bytes32 docHash, address user)` - Revoke document access
- `requestSignaturesAndEscrow(...)` - Request signatures with escrow
- `signDocument(bytes32 docHash, ...)` - Sign document with Ethereum signature
- `cancelSignatureRequest(bytes32 docHash)` - Cancel and refund escrow
- `revokeDocument(bytes32 docHash)` - Mark document as revoked
- `verifyMLInference(...)` - Verify ZKML proofs
- `pause()/unpause()` - Emergency controls

**Gas Optimizations:**
- Custom errors instead of strings
- Calldata for external functions
- Efficient storage packing
- Minimal SLOAD operations

---

## 🎨 UI/UX Features

### Design System

- **Glassmorphism** - Modern frosted glass effects
- **Gradient Accents** - Purple-cyan brand identity
- **Micro-interactions** - Smooth hover and click effects
- **Staggered Animations** - Sequential element appearances
- **Loading States** - Skeleton screens and spinners
- **Empty States** - Engaging placeholders
- **Tooltips** - Contextual help throughout

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search
- `Ctrl/Cmd + R` - Refresh data
- `Ctrl/Cmd + N` - New case (Legal dashboard)
- `Escape` - Close modals
- `Enter` - Confirm actions

### Accessibility

- WCAG AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- High contrast mode
- 44px minimum touch targets

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Check for linting errors

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Smart contract libraries
- **IPFS** - Decentralized storage protocol
- **Ethereum** - Blockchain platform
- **React Team** - Frontend framework
- **Tailwind Labs** - CSS framework
- **Lucide Icons** - Beautiful icon set

---

## 📞 Support

For support, email support@blockvault.io or join our Discord community.

### Useful Links

- **Documentation**: [docs.blockvault.io](https://docs.blockvault.io)
- **API Reference**: [api.blockvault.io](https://api.blockvault.io)
- **Discord**: [discord.gg/blockvault](https://discord.gg/blockvault)
- **Twitter**: [@BlockVault](https://twitter.com/BlockVault)

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Multi-chain support (Polygon, BSC)
- [ ] Mobile app (React Native)
- [ ] Advanced ZKML models
- [ ] Team collaboration features

### Q2 2025
- [ ] Decentralized identity (DID)
- [ ] NFT document certificates
- [ ] DAO governance
- [ ] Enterprise licensing

### Q3 2025
- [ ] Full IPFS node integration
- [ ] Filecoin storage
- [ ] Layer 2 scaling
- [ ] API marketplace

---

<div align="center">

**Built with 💜 by the BlockVault Team**

⭐ Star us on GitHub — it helps!

</div>
