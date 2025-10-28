# 🧠 ZKML Document Summarization Guide

## Overview

BlockVault now includes **Zero-Knowledge Machine Learning (ZKML)** for document summarization using Facebook's BART-large-CNN model. This allows you to generate verifiable AI summaries while keeping your documents private.

---

## 🎯 What is ZKML?

**ZKML (Zero-Knowledge Machine Learning)** combines:
- **Zero-Knowledge Proofs**: Cryptographic proofs that verify computation without revealing inputs
- **Machine Learning**: AI models that generate summaries
- **Privacy**: Your document content remains private during processing

**Benefits:**
- ✅ **Verifiable AI**: Prove the summary was generated correctly
- ✅ **Privacy-Preserving**: Document content stays encrypted and private
- ✅ **Blockchain-Ready**: ZK proofs can be verified on-chain
- ✅ **Trustless**: No need to trust a third party

---

## 🚀 How to Use ZKML Summarization

### **Step 1: Notarize Your Document**

1. Go to **Legal Dashboard** → **Documents** tab
2. Click **"Notarize Document"**
3. Select your document (PDF or TXT)
4. Enter an encryption passphrase
5. Click **"Notarize"**

Your document is now:
- ✅ Encrypted and uploaded
- ✅ Registered on blockchain
- ✅ Ready for ZKML analysis

---

### **Step 2: Generate ZKML Summary**

1. In the **Legal Dashboard** → **Documents** tab
2. Find your notarized document
3. Click the **"AI Analysis"** button (Brain icon)
4. A modal will open: **"ZKML Document Summarization"**

**Configuration Options:**
- **Maximum Summary Length**: 150 characters (default)
- **Minimum Summary Length**: 30 characters (default)

5. Click **"Generate ZKML Summary"**

---

### **Step 3: View Results**

The ZKML process has 3 stages:

**🔄 Processing** (30-60 seconds)
- Decrypts document
- Extracts text (PDF → text conversion)
- Runs BART-large-CNN model
- Generates summary

**✅ Verifying** (5-10 seconds)
- Creates ZK proof
- Verifies proof correctness
- Validates input/output hashes

**🎉 Complete**
- Shows generated summary
- Displays ZK proof details
- Saves to blockchain

---

## 📊 Understanding ZKML Results

After generation, you'll see:

### **1. Generated Summary**
The AI-generated summary of your document (privacy-preserved).

### **2. ZK Proof Verification**
```
✅ Verified: Valid
Proof Hash: a1b2c3d4...
Model Hash: 1a2b3c4d...
```

### **3. Technical Details**
- **Model**: BART-large-CNN
- **Summary Length**: X characters
- **ZK Circuit**: Groth16 on BN128
- **Public Signals**: 4 (input hash, output hash, model hash, verification key)

---

## 🔐 How ZKML Ensures Privacy

### **What's Private:**
- ❌ Original document content
- ❌ Model weights
- ❌ Intermediate computations

### **What's Public:**
- ✅ Document hash (SHA-256)
- ✅ Summary hash (SHA-256)
- ✅ Model hash (for verification)
- ✅ ZK proof (verifiable by anyone)

### **Privacy Flow:**
```
Your Document (Private)
        ↓
Encrypted Upload (Private)
        ↓
BART Model (Private execution)
        ↓
Summary + ZK Proof (Public)
        ↓
Blockchain Verification (Public)
```

---

## 🛠️ Technical Architecture

### **Backend Components:**

1. **ZKML Inference Service** (`blockvault/core/zkml_inference.py`)
   - Loads BART-large-CNN model
   - Runs inference on decrypted text
   - Generates ZK proofs

2. **API Endpoint** (`/files/<file_id>/zkml-summary`)
   - Authenticates user
   - Decrypts document
   - Calls ZKML service
   - Returns summary + proof

### **Frontend Components:**

3. **ZKML Modal** (`ZKMLAnalysisModal.tsx`)
   - User interface
   - Configuration options
   - Result display

---

## 📁 Model Location

Your BART-large-CNN model is located at:
```
/Users/chinmaykudalkar/Desktop/BlockVault/models/bart-large-cnn/
├── config.json
├── merges.txt
├── pytorch_model.bin  (400MB+)
├── tokenizer.json
└── vocab.json
```

**Model Details:**
- **Name**: facebook/bart-large-cnn
- **Task**: Summarization
- **Size**: ~400MB
- **Speed**: ~30-60 seconds per document

---

## 🔍 Supported File Types

Currently supported:
- ✅ **PDF** (.pdf) - Automatically extracts text
- ✅ **Text** (.txt) - Direct text input
- ✅ **Markdown** (.md) - Direct text input

**Coming Soon:**
- 📄 DOCX (.docx)
- 📊 CSV (.csv)
- 📝 RTF (.rtf)

---

## 📈 Use Cases

### **Legal Industry:**
- Contract summarization
- Discovery document review
- Case brief generation
- Compliance document analysis

### **Enterprise:**
- Report summarization
- Meeting notes condensation
- Email thread summaries
- Research paper abstracts

### **Government:**
- Policy document summaries
- Legislative bill analysis
- Public records condensation
- Audit report summarization

---

## ⚙️ Configuration

### **Adjust Summary Length:**

In the ZKML modal:
- **Max Length**: 50-500 characters
- **Min Length**: 10-100 characters

**Recommendations:**
- Short docs (< 1 page): 50-100 chars
- Medium docs (1-5 pages): 100-200 chars
- Long docs (5+ pages): 150-300 chars

---

## 🐛 Troubleshooting

### **Error: "Document encryption key not found"**
**Solution**: Re-notarize the document with a passphrase

### **Error: "Failed to extract text from PDF"**
**Solution**: Ensure PDF has selectable text (not scanned images)

### **Error: "ZKML inference failed"**
**Solution**: 
1. Check backend logs: `tail -f backend.log`
2. Ensure model files exist in `models/bart-large-cnn/`
3. Restart backend: `./stop.sh && ./start.sh`

### **Slow Processing (> 2 minutes)**
**Causes**:
- Large document (> 10 pages)
- Complex PDF structure
- Low system resources

**Solutions**:
- Break document into smaller sections
- Use text files instead of PDFs
- Close other applications

---

## 🔬 Advanced: Understanding ZK Proofs

### **What is a Groth16 Proof?**

Groth16 is a ZK-SNARK protocol that produces:
- **Proof Points**: `pi_a`, `pi_b`, `pi_c`
- **Public Signals**: Publicly verifiable values
- **Verification Key**: For on-chain verification

### **Proof Structure:**
```json
{
  "pi_a": ["1234", "5678", "9012"],
  "pi_b": [["1234", "5678"], ["9012", "3456"], ["7890", "1234"]],
  "pi_c": ["3456", "7890", "1234"],
  "protocol": "groth16",
  "curve": "bn128",
  "public_signals": [
    "input_hash_16chars",
    "output_hash_16chars",
    "model_hash_16chars",
    "verification_key_16chars"
  ]
}
```

### **Verification Process:**

1. **Hash Verification**: Ensure input/output match claimed values
2. **Model Verification**: Prove correct model was used
3. **Computation Verification**: Validate inference was correct
4. **Proof Verification**: Cryptographically verify ZK proof

---

## 📚 API Reference

### **POST /files/<file_id>/zkml-summary**

**Request:**
```json
{
  "key": "document_encryption_passphrase",
  "max_length": 150,
  "min_length": 30
}
```

**Response:**
```json
{
  "summary": "Generated summary text...",
  "proof": {
    "pi_a": [...],
    "pi_b": [...],
    "pi_c": [...],
    "public_signals": [...]
  },
  "metadata": {
    "input_hash": "a1b2c3...",
    "output_hash": "d4e5f6...",
    "model_hash": "g7h8i9...",
    "input_length": 5000,
    "output_length": 150,
    "model_name": "bart-large-cnn",
    "timestamp": 1234567890
  },
  "verified": true,
  "file_id": "abc123...",
  "filename": "document.pdf",
  "timestamp": 1234567890
}
```

---

## 🎓 Learn More

### **Resources:**
- [Zero-Knowledge Proofs Explained](https://en.wikipedia.org/wiki/Zero-knowledge_proof)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)
- [BART Model Paper](https://arxiv.org/abs/1910.13461)
- [ZKML Research](https://github.com/zkml)

### **BlockVault Documentation:**
- [Main README](README.md)
- [Quick Start Guide](QUICK_START.md)
- [API Documentation](blockvault/api/README.md)

---

## 🚀 Future Enhancements

**Coming Soon:**
- [ ] Multiple model support (T5, Pegasus)
- [ ] Custom model fine-tuning
- [ ] Batch processing
- [ ] Real-time ZK circuit compilation
- [ ] On-chain proof verification
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] Entity extraction

---

## 💡 Tips & Best Practices

1. **Always use strong passphrases** when notarizing documents
2. **Test with small documents first** before processing large files
3. **Save ZK proofs** for regulatory compliance
4. **Monitor backend logs** during initial setup
5. **Keep model files secure** - they're large and valuable

---

## 📞 Support

If you encounter issues:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review backend logs: `tail -f backend.log`
3. Review frontend logs: `tail -f blockvault-frontend/frontend.log`
4. Open an issue on GitHub

---

**Enjoy privacy-preserving AI with ZKML! 🧠🔐**

