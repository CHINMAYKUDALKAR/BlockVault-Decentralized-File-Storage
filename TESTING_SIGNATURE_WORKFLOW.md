# Testing Signature Request Workflow

## ⚠️ CRITICAL: In-Memory Database Notice

Your system uses an **in-memory database**, which means:
- ❌ **Data is lost when backend restarts**
- ✅ **All testing must happen in ONE session**
- ✅ **Don't restart backend during testing**

---

## 🧪 Complete Testing Workflow

### Prerequisites

1. **Two browser instances:**
   - Browser A: Normal mode (User A - Sender)
   - Browser B: Incognito/different browser (User B - Receiver)

2. **Two separate wallets** (different addresses)

3. **Backend running** (don't restart during test!)

---

## Step-by-Step Test

### **Step 1: Setup User A (Sender)** 👤

**Browser A (Normal Mode):**

1. Open: `http://localhost:3000`
2. **Connect Wallet A**
3. **Complete Login**
4. Go to **Settings** (or Legal Dashboard)
5. **Generate RSA Keys**
   - Click "Generate RSA Keys"
   - Enter passphrase (e.g., `test123`)
   - Should auto-register with backend
   - ✅ Confirm: "RSA keys generated successfully"
6. **Note your wallet address** (e.g., `0xe947...ae3a`)

---

### **Step 2: Setup User B (Receiver)** 👥

**Browser B (Incognito Mode):**

1. Open: `http://localhost:3000` (incognito)
2. **Connect Wallet B** (different wallet!)
3. **Complete Login**
4. Go to **Settings** or **Legal Dashboard**
5. **Generate RSA Keys** ← **CRITICAL!**
   - Click "Generate RSA Keys"
   - Enter passphrase (e.g., `test456`)
   - Should auto-register with backend
   - ✅ Confirm: "RSA keys generated successfully"
6. **Copy wallet address** (e.g., `0x63c5...ee12`)

---

### **Step 3: Notarize Document (User A)** 📄

**Browser A:**

1. Go to **Legal Dashboard**
2. Click **"Notarize Document"**
3. Upload a **PDF file**
4. Enter passphrase: `1234`
5. Click **"Notarize"**
6. **Open Browser Console** (F12)
7. Check for:
   ```
   ✅ File uploaded to backend successfully!
   📋 Upload data: { fileId: "1761684123456_0", ... }
   ✅ File verified in backend
   🔐 Encryption key stored for: 1761684123456_0
   ```
8. ✅ Document appears in **Documents** tab

---

### **Step 4: Send Signature Request (User A)** ✉️

**Browser A:**

1. Find the notarized document
2. Click **"Request"** (Request Signature button)
3. **Add Signer:**
   - Address: `0x63c5...ee12` (User B's address - PASTE IT!)
   - Name: `John Doe` (optional)
   - Click **"Add Signer"**
4. **Check Passphrase:**
   - Should auto-fill with `1234`
   - If not, manually enter `1234`
5. Click **"Send Request"**

**Expected Console Output:**
```javascript
🔄 Starting file sharing process...
📋 Document to share: { 
  id: "1761684123456_0", 
  file_id: "1761684123456_0", 
  name: "test.pdf" 
}
👥 Signers: [{ address: "0x63c5ddee...", name: "John Doe" }]
🔑 Passphrase available: true
📎 Using file_id for sharing: 1761684123456_0
📤 Attempting to share with: 0x63c5ddee...
🔗 API URL: http://localhost:5000/files/1761684123456_0/share
✅ Successfully shared file with 0x63c5ddee...
✅ Signature request created
```

**Success Toast:**
```
✅ Signature requests sent successfully!
```

**OR if failed:**
```
❌ Failed to share document with all signers. 
Errors: 0x63c5ddee... hasn't registered RSA keys
```

---

### **Step 5: View Signature Request (User B)** 👁️

**Browser B (Incognito):**

1. Go to **Legal Dashboard**
2. Go to **Signature Requests** tab
3. You should see the signature request
4. Click **"View Document"**

**Expected:**
- ✅ Modal opens
- ✅ PDF displays inline in iframe
- ✅ "Sign Document" button available
- ❌ No download prompt

**Console Output:**
```javascript
📡 Loaded signature requests from server
Found shared file: { file_id: "1761684123456_0", ... }
Has encrypted_key: true
Attempting to decrypt key...
✅ Document preview loaded
```

---

### **Step 6: Sign Document (User B)** ✍️

**Browser B:**

1. Review the document in the modal
2. Click **"Sign Document"**
3. Confirm signing
4. ✅ Document gets signed
5. ✅ Modal closes
6. ✅ Signature request status changes to "Signed"

---

## 🔍 Debugging Checklist

If something fails, check these in order:

### ✅ **Backend Running**
```bash
curl http://localhost:5000/health
# Should return: {"status": "ok"}
```

### ✅ **User B Has RSA Keys**
- Browser B → Settings → RSA Keys section
- Should show "Public Key: -----BEGIN PUBLIC KEY-----..."
- If not, generate keys!

### ✅ **Correct File ID**
- After notarizing, check console
- `file_id` should look like: `"1761684123456_0"`
- Should NOT be `undefined` or `null`

### ✅ **Passphrase Stored**
- After notarizing, check console
- Should see: "🔐 Encryption key stored for: 1761684123456_0"

### ✅ **Sharing Works**
- After sending signature request, check console
- Should see: "✅ Successfully shared file with 0x63c5ddee..."
- If failed, check the error message

### ✅ **File Exists in Backend**
```bash
# Check backend logs
tail -f backend.log

# Should see:
📤 Share request: file_id=1761684123456_0, owner=0xe947...
Looking up file_id: 1761684123456_0
Found file: test.pdf
```

---

## 🐛 Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Backend restarted** | All files gone | Don't restart! Notarize again |
| **No RSA keys (User B)** | "recipient has not registered RSA keys" | User B must generate RSA keys |
| **Wrong passphrase** | "Cannot preview document" | Use same passphrase from notarization |
| **Failed to fetch** | Network error | Check backend is running on port 5000 |
| **File not found (404)** | Document doesn't exist | Backend was restarted, notarize again |
| **Pop-up blocked** | View doesn't open | Allow pop-ups for localhost:3000 |

---

## 📝 Test Checklist

- [ ] Backend running (no restarts!)
- [ ] User A: Wallet connected
- [ ] User A: RSA keys generated
- [ ] User B: Wallet connected (different wallet!)
- [ ] User B: RSA keys generated
- [ ] User A: Document notarized
- [ ] User A: Signature request sent
- [ ] User B: Signature request received
- [ ] User B: Can view document
- [ ] User B: Can sign document

---

## 🎯 Quick Test Commands

### Check Backend Logs in Real-Time
```bash
tail -f backend.log | grep -E "share|Share|file_id|404|500"
```

### Check Frontend Console
Press F12, look for:
- Red errors (❌)
- Green successes (✅)
- Warning triangles (⚠️)

---

## 💡 Pro Tips

1. **Keep console open** during entire workflow
2. **Don't refresh browser** unnecessarily  
3. **Don't restart backend** during testing
4. **Copy-paste addresses** (don't type manually)
5. **Use same passphrase** for notarization and sharing

---

## Expected Timeline

| Action | Time | Notes |
|--------|------|-------|
| Generate RSA Keys | 5-10 seconds | Do once per user |
| Notarize Document | 2-5 seconds | Upload + ZK proof |
| Send Signature Request | 1-2 seconds | Share + create request |
| View Document | 1-2 seconds | Decrypt + display |
| Sign Document | 1-2 seconds | Record signature |

**Total: ~15-30 seconds for complete workflow**

---

**Now try the complete workflow from Step 1!** 🚀

