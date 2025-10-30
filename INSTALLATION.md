# 📦 BlockVault - Complete Installation Guide

This guide will walk you through setting up BlockVault on your local machine or server.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Installation](#detailed-installation)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | 16.x or higher | [nodejs.org](https://nodejs.org) |
| **Python** | 3.9 or higher | [python.org](https://python.org) |
| **MongoDB** | 4.4 or higher | [mongodb.com](https://mongodb.com/try/download/community) |
| **IPFS** | Latest | [ipfs.io](https://docs.ipfs.io/install/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |
| **MetaMask** | Browser Extension | [metamask.io](https://metamask.io) |

### Verify Installation

```bash
# Check Node.js
node --version  # Should be v16.x or higher

# Check Python
python3 --version  # Should be 3.9 or higher

# Check MongoDB
mongod --version  # Should be 4.4 or higher

# Check IPFS
ipfs --version  # Should be latest stable

# Check Git
git --version
```

---

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/BlockVault.git
cd BlockVault

# 2. Setup backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Setup frontend
cd blockvault-frontend
npm install
cd ..

# 4. Start services
# Terminal 1: MongoDB
mongod

# Terminal 2: IPFS
ipfs daemon

# Terminal 3: Backend
cd backend && python app.py

# Terminal 4: Frontend
cd blockvault-frontend && npm start

# 5. Open browser
# Visit http://localhost:3000
```

---

## 📖 Detailed Installation

### Step 1: Clone and Navigate

```bash
git clone https://github.com/yourusername/BlockVault.git
cd BlockVault
```

### Step 2: Python Backend Setup

#### Create Virtual Environment

```bash
# Create venv
python3 -m venv venv

# Activate venv
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Your prompt should now show (venv)
```

#### Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Dependencies include:**
- Flask 3.0.0 - Web framework
- PyMongo 4.6.0 - MongoDB driver
- Cryptography 41.0.7 - Encryption
- PyJWT 2.8.0 - Authentication
- And more (see requirements.txt)

### Step 3: Frontend Setup

```bash
cd blockvault-frontend

# Install dependencies
npm install

# This installs:
# - React 18.x
# - TypeScript
# - Tailwind CSS
# - Ethers.js v6
# - And more (see package.json)
```

### Step 4: MongoDB Setup

#### Start MongoDB

**macOS (Homebrew):**
```bash
brew services start mongodb-community
```

**Linux (systemd):**
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
```bash
# Run as Administrator
net start MongoDB
```

**Manual Start:**
```bash
mongod --dbpath /path/to/data/directory
```

#### Verify MongoDB

```bash
# Connect to MongoDB shell
mongosh

# Should see:
# > Connected to: mongodb://localhost:27017
```

### Step 5: IPFS Setup

#### Initialize IPFS (First Time Only)

```bash
ipfs init

# You should see:
# > generating ED25519 keypair...done
# > peer identity: Qm...
```

#### Configure IPFS

```bash
# Enable CORS for API access
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000", "http://localhost:5000"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

#### Start IPFS Daemon

```bash
ipfs daemon

# Should see:
# > Daemon is ready
```

### Step 6: Smart Contract Setup (Optional)

If you want to deploy smart contracts locally:

```bash
cd contracts

# Install Hardhat dependencies
npm install

# Compile contracts
npx hardhat compile

# Start local blockchain
npx hardhat node  # Keep this running

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost

# Note the deployed contract address
```

---

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/blockvault

# IPFS
IPFS_API_URL=http://127.0.0.1:5001

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SECRET_KEY=your-flask-secret-key-change-this-in-production

# Flask
FLASK_ENV=development
FLASK_APP=app.py
FLASK_DEBUG=1

# CORS
CORS_ORIGINS=http://localhost:3000

# Optional: ML Models
ML_MODEL_PATH=../models/
ENABLE_ZKML=false
```

### Frontend Configuration

Create `blockvault-frontend/.env`:

```env
# Backend API
REACT_APP_BACKEND_URL=http://localhost:5000

# Blockchain
REACT_APP_CONTRACT_ADDRESS=0x... # Your deployed contract address
REACT_APP_NETWORK_NAME=localhost
REACT_APP_CHAIN_ID=31337

# IPFS
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/
REACT_APP_IPFS_API=http://localhost:5001

# Features
REACT_APP_ENABLE_ZKML=false
REACT_APP_ENABLE_ANALYTICS=false
```

### Smart Contract Configuration

Update `contracts/hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Add other networks as needed
  }
};
```

---

## 🏃 Running the Application

### Development Mode

You need **4 terminal windows**:

#### Terminal 1: MongoDB
```bash
mongod
# Or if using brew services:
# brew services start mongodb-community
```

#### Terminal 2: IPFS
```bash
ipfs daemon
```

#### Terminal 3: Backend
```bash
cd backend
source ../venv/bin/activate  # Windows: ..\venv\Scripts\activate
python app.py

# Backend will start on http://localhost:5000
```

#### Terminal 4: Frontend
```bash
cd blockvault-frontend
npm start

# Frontend will start on http://localhost:3000
# Browser should open automatically
```

### Production Mode

#### Backend (with Gunicorn)
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Frontend (Build)
```bash
cd blockvault-frontend
npm run build
# Serve the build folder with nginx or similar
```

---

## 🔍 Verification

### Check Services Are Running

```bash
# MongoDB
curl http://localhost:27017
# Should see: "It looks like you are trying to access MongoDB over HTTP"

# IPFS
curl http://localhost:5001/api/v0/id
# Should return JSON with peer ID

# Backend
curl http://localhost:5000/health
# Should return: {"status": "healthy"}

# Frontend
# Visit http://localhost:3000 in browser
# Should see BlockVault landing page
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error

**Problem:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# If not running, start it
mongod --dbpath /path/to/data
```

### IPFS Connection Error

**Problem:** `Cannot connect to IPFS daemon`

**Solution:**
```bash
# Check if IPFS daemon is running
ipfs id

# If not running
ipfs daemon

# Check API endpoint
curl http://localhost:5001/api/v0/version
```

### Port Already in Use

**Problem:** `Port 3000/5000 already in use`

**Solution:**
```bash
# Find and kill process
# macOS/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### MetaMask Not Detected

**Problem:** `MetaMask is not installed`

**Solution:**
1. Install MetaMask from [metamask.io](https://metamask.io)
2. Reload the page
3. Click "Connect Wallet"

### Python Dependency Errors

**Problem:** `ModuleNotFoundError` or installation failures

**Solution:**
```bash
# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies one by one
pip install Flask==3.0.0
pip install pymongo==4.6.0
# ... etc

# Or use specific Python version
python3.9 -m pip install -r requirements.txt
```

### Node Module Errors

**Problem:** `Cannot find module` errors

**Solution:**
```bash
cd blockvault-frontend

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Smart Contract Deployment Fails

**Problem:** Contract deployment errors

**Solution:**
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile

# Check Hardhat node is running
# Terminal 1:
npx hardhat node

# Terminal 2:
npx hardhat run scripts/deploy.js --network localhost
```

---

## 🔐 Security Notes

### Development Environment

- ⚠️ Never commit `.env` files
- ⚠️ Use test wallets with no real funds
- ⚠️ MongoDB and IPFS should not be exposed to internet
- ⚠️ Change default JWT secrets

### Production Environment

- ✅ Use strong, unique JWT secrets
- ✅ Enable MongoDB authentication
- ✅ Use HTTPS for all connections
- ✅ Implement rate limiting
- ✅ Regular security audits
- ✅ Use hardware wallets
- ✅ Enable firewall rules
- ✅ Keep dependencies updated

---

## 📚 Next Steps

After installation:

1. **Read the [User Guide](USAGE.md)** - Learn how to use all features
2. **Review [API Documentation](API.md)** - Understand the backend endpoints
3. **Check [Smart Contract Docs](CONTRACTS.md)** - Learn about blockchain integration
4. **Join [Discord Community](https://discord.gg/blockvault)** - Get help and share feedback

---

## 🆘 Getting Help

- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community support
- **Email**: support@blockvault.io
- **Documentation**: docs.blockvault.io

---

**Happy Building! 🚀**

Made with ❤️ in India 🇮🇳

