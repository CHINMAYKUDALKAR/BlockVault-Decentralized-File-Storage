# 🚀 BlockVault - Quick Start Guide

## **Starting the Application**

### **Method 1: Using the Start Script (Recommended)**

Simply run:
```bash
./start.sh
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Free ports if needed
- ✅ Start backend server (Flask on port 5000)
- ✅ Start frontend server (React on port 3000)
- ✅ Wait for both to be ready
- ✅ Show you all the important information

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║          🎉 BlockVault Started Successfully! 🎉        ║
╚════════════════════════════════════════════════════════╝

📱 Frontend:  http://localhost:3000
🔧 Backend:   http://localhost:5000

Press Ctrl+C to stop all services
```

---

### **Method 2: Manual Start**

**Terminal 1 - Backend:**
```bash
cd /Users/chinmaykudalkar/Desktop/BlockVault
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd /Users/chinmaykudalkar/Desktop/BlockVault/blockvault-frontend
npm start
```

---

## **Stopping the Application**

### **Option 1: Using Stop Script**
```bash
./stop.sh
```

### **Option 2: If Running start.sh**
Press `Ctrl + C` in the terminal where start.sh is running

### **Option 3: Manual Kill**
```bash
lsof -ti:3000 | xargs kill -9  # Stop frontend
lsof -ti:5000 | xargs kill -9  # Stop backend
```

---

## **Accessing the Application**

Once both servers are running:

1. **Open your browser** to: http://localhost:3000
2. **Connect your wallet** (MetaMask)
3. **Complete onboarding** (set up profile)
4. **Generate RSA keys** (for signature workflow)
5. **Start using BlockVault!** ✨

---

## **Checking Logs**

### **Backend Logs:**
```bash
tail -f backend.log
```

### **Frontend Logs:**
```bash
tail -f blockvault-frontend/frontend.log
```

### **Check Running Processes:**
```bash
lsof -i :3000 -i :5000
```

---

## **Troubleshooting**

### **Port Already in Use**

The start.sh script automatically handles this, but if you need to manually free ports:

```bash
# Free port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9

# Free port 5000 (Backend)
lsof -ti:5000 | xargs kill -9
```

### **"Too Many Open Files" Error**

Increase file limits:
```bash
ulimit -n 10240
```

Then restart the frontend.

### **Dependencies Not Installed**

**Backend:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd blockvault-frontend
npm install
```

---

## **First Time Setup**

### **1. Install Prerequisites**
- Python 3.9+
- Node.js 16+
- npm

### **2. Run Initial Setup**
```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install frontend dependencies
cd blockvault-frontend
npm install
cd ..
```

### **3. Start the App**
```bash
./start.sh
```

---

## **Legal Workflow - Quick Guide**

### **Upload Legal Document:**
1. Legal Dashboard → Legal Documents tab
2. Click "Upload Document"
3. Select file + enter passphrase
4. Upload (passphrase auto-stored!)

### **Request Signature:**
1. Find document → "Request Signature"
2. ✅ Passphrase auto-retrieved!
3. Add signer addresses
4. Send request

### **Sign Document:**
1. Login as signer
2. Generate RSA keys (one-time)
3. Signature Requests tab
4. Click "View Document"
5. Review & sign

---

## **Key Features**

- 🔐 **End-to-end encryption** - Documents encrypted client-side
- ⛓️ **Blockchain notarization** - Immutable document records
- ✍️ **Digital signatures** - Request and collect signatures
- 🔑 **RSA key exchange** - Secure key sharing
- 📁 **Case management** - Organize documents by case
- 🔍 **Chain of custody** - Full audit trail
- 🎨 **Premium UI** - Dark theme with glassmorphic design

---

## **Support**

For issues or questions:
- Check the logs: `tail -f backend.log`
- Check browser console (F12)
- Restart services: `./stop.sh && ./start.sh`

---

**Enjoy BlockVault! 🔐✨**

