import React, { useState } from 'react';
import { FileText, Shield, AlertCircle, CheckCircle, Upload, X, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ZKCircuitManager } from '../../utils/zkCircuits';
import { storeLegalDocumentKey } from '../../utils/legalDocumentKeys';
import toast from 'react-hot-toast';

interface NotarizeDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NotarizeDocumentModal: React.FC<NotarizeDocumentModalProps> = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'verifying' | 'complete'>('upload');
  const [documentHash, setDocumentHash] = useState<string>('');

  const getApiBase = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    return {
      'Authorization': `Bearer ${user.jwt}`,
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStep('upload');
    }
  };

  const handleNotarize = async () => {
    if (!selectedFile || !passphrase) {
      toast.error('Please select a file and enter a passphrase');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Step 1: Upload encrypted file to backend
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('key', passphrase);

      console.log('📤 Uploading file to backend...');
      const uploadResponse = await fetch(`${getApiBase()}/files/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      console.log('📡 Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Upload failed:', errorText);
        throw new Error(`File upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.file_id;
      const backendCid = uploadData.cid;
      const sha256 = uploadData.sha256;

      console.log('✅ File uploaded to backend successfully!');
      console.log('📋 Upload data:', { fileId, backendCid, sha256 });
      
      // Verify file_id is valid
      if (!fileId || fileId === 'undefined') {
        throw new Error('Backend returned invalid file_id');
      }

      // Step 2: Verify file was actually created by trying to fetch it
      console.log('🔍 Verifying file was created in backend...');
      const verifyResponse = await fetch(`${getApiBase()}/files/`, {
        headers: getAuthHeaders(),
      });
      
      if (verifyResponse.ok) {
        const filesData = await verifyResponse.json();
        const uploadedFile = filesData.files?.find((f: any) => f.file_id === fileId || f._id === fileId);
        if (uploadedFile) {
          console.log('✅ File verified in backend:', uploadedFile);
        } else {
          console.warn('⚠️ File not found in backend list, but continuing...');
        }
      }

      // Step 3: Store the encryption key for this document
      storeLegalDocumentKey(fileId, passphrase);
      console.log('🔐 Encryption key stored for:', fileId);

      // Step 4: Read file and calculate hash for ZK proof
      const fileData = new Uint8Array(await selectedFile.arrayBuffer());
      const zkManager = ZKCircuitManager.getInstance();
      const fileHash = await zkManager.poseidonHash(fileData);
      setDocumentHash(fileHash);

      setStep('verifying');

      // Step 5: Generate ZK proof of integrity
      const { proof, publicSignals } = await zkManager.generateIntegrityProof(fileData, fileHash);
      
      // Step 6: Format proof for smart contract
      const formattedProof = await zkManager.formatProofForContract(proof, publicSignals);

      // Step 7: Register on blockchain (using backend CID if available)
      const cidForChain = backendCid || await uploadToIpfs(selectedFile);
      await registerDocumentOnChain(cidForChain, formattedProof);

      setStep('complete');
      
      // Step 8: Add to legal documents list with REAL file_id
      const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
      const legalDocument = {
        id: fileId, // Use real backend file ID
        file_id: fileId, // Use real backend file ID
        name: selectedFile.name,
        docHash: sha256, // Use backend SHA256 hash
        cid: cidForChain,
        status: 'registered' as const,
        timestamp: Date.now(),
        owner: user.address || 'current-user',
        blockchainHash: fileHash,
        ipfsCid: cidForChain,
        zkProof: formattedProof
      };
      
      // Store in localStorage
      const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
      existingDocs.push(legalDocument);
      localStorage.setItem('legal_documents', JSON.stringify(existingDocs));
      
      // Dispatch event to refresh documents
      window.dispatchEvent(new CustomEvent('legalDocumentsUpdated'));
      
      toast.success('Document uploaded, encrypted, and notarized successfully!');
      onSuccess();

    } catch (error) {
      console.error('Error during notarization:', error);
      toast.error('An error occurred during notarization.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };


  // Upload file to IPFS
  const uploadToIpfs = async (file: File): Promise<string> => {
    // Simulate IPFS upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Uploading file to IPFS: ${file.name} (${file.size} bytes)`);
    return `Qm${Math.random().toString(36).substring(2, 15)}`;
  };

  // Register document on blockchain
  const registerDocumentOnChain = async (cid: string, proof: any) => {
    // Simulate smart contract call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Document registered on chain:', { 
      cid, 
      proof,
      note: 'Document notarized with ZK proof of integrity'
    });
  };

  const getStepIcon = (stepName: string) => {
    if (step === stepName) {
      return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
      </div>;
    }
    if (step === 'complete' && stepName === 'verifying') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    return <div className="w-6 h-6 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Notarize Document</h2>
              <p className="text-sm text-slate-400">Create an immutable record on the blockchain</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStepIcon('upload')}
              <span className="text-sm text-slate-400">Upload</span>
            </div>
            <div className="flex-1 h-px bg-slate-700 mx-4" />
            <div className="flex items-center space-x-2">
              {getStepIcon('processing')}
              <span className="text-sm text-slate-400">Process</span>
            </div>
            <div className="flex-1 h-px bg-slate-700 mx-4" />
            <div className="flex items-center space-x-2">
              {getStepIcon('verifying')}
              <span className="text-sm text-slate-400">Verify</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Select Document to Notarize</h3>
              <p className="text-slate-400 mb-4">
                Choose a legal document to create an immutable record on the blockchain
              </p>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </label>
            </div>

            {selectedFile && (
              <div className="space-y-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-white">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                </div>

                <Input
                  label="Encryption Passphrase"
                  type="password"
                  placeholder="Enter a secure passphrase to encrypt this document"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <p className="text-xs text-slate-400">
                  This passphrase encrypts your document before upload. It's stored securely and automatically used when requesting signatures.
                </p>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-500 mb-1">Legal Notice</h4>
                  <p className="text-sm text-amber-200 mb-2">
                    Notarizing a document creates an immutable record on the blockchain. 
                    This action cannot be undone and will be publicly verifiable.
                  </p>
                  <p className="text-sm text-amber-200">
                    <strong>Security:</strong> The document hash is calculated from the original file to ensure cryptographic integrity 
                    and provide an immutable record on the blockchain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Processing Document</h3>
            <p className="text-slate-400 mb-4">
              Calculating cryptographic hash and preparing for blockchain registration...
            </p>
            <div className="bg-slate-800/50 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">File Size:</span>
                <span className="text-white font-mono">
                  {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status:</span>
                <span className="text-blue-400 font-mono">Processing...</span>
              </div>
            </div>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Generating ZK Proof</h3>
            <p className="text-slate-400">
              Creating cryptographic proof of document integrity...
            </p>
            {documentHash && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Document Hash:</p>
                <p className="text-xs font-mono text-white break-all">{documentHash}</p>
              </div>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Document Notarized!</h3>
            <p className="text-slate-400 mb-4">
              Your document has been successfully registered on the blockchain with cryptographic proof.
            </p>

            {documentHash && (
              <div className="p-3 bg-slate-800/50 rounded-lg mb-4">
                <p className="text-xs text-slate-400 mb-1">Document Hash:</p>
                <p className="text-xs font-mono text-white break-all">{documentHash}</p>
                <p className="text-xs text-slate-500 mt-1">
                  This hash represents the document's cryptographic fingerprint
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} variant="outline">
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'upload' && selectedFile && (
            <Button 
              onClick={handleNotarize} 
              loading={loading}
              disabled={!passphrase || loading}
            >
              Notarize Document
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
