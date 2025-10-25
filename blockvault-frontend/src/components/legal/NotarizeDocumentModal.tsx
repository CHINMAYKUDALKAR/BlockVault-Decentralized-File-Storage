import React, { useState } from 'react';
import { FileText, Shield, AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ZKCircuitManager } from '../../utils/zkCircuits';
import toast from 'react-hot-toast';

interface NotarizeDocumentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NotarizeDocumentModal: React.FC<NotarizeDocumentModalProps> = ({ onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'verifying' | 'complete'>('upload');
  const [documentHash, setDocumentHash] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStep('upload');
    }
  };

  const handleNotarize = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStep('processing');

    try {
      // 1. Read file and calculate hash
      const fileData = new Uint8Array(await selectedFile.arrayBuffer());
      const zkManager = ZKCircuitManager.getInstance();
      const fileHash = await zkManager.poseidonHash(fileData);
      setDocumentHash(fileHash);

      // 2. Upload to IPFS
      const cid = await uploadToIpfs(selectedFile);
      setStep('verifying');

      // 3. Generate ZK proof of integrity
      const { proof, publicSignals } = await zkManager.generateIntegrityProof(fileData, fileHash);
      
      // 4. Format proof for smart contract
      const formattedProof = await zkManager.formatProofForContract(proof, publicSignals);

      // 5. Call smart contract to notarize
      await registerDocumentOnChain(cid, formattedProof);

      setStep('complete');
      toast.success('Document successfully notarized on the blockchain!');
      
      // Add to legal documents list
      const legalDocument = {
        id: Date.now().toString(),
        file_id: Date.now().toString(),
        name: selectedFile.name,
        docHash: fileHash,
        cid: cid,
        status: 'registered' as const,
        timestamp: Date.now(),
        owner: 'current-user', // This would be the current user's address
        blockchainHash: fileHash,
        ipfsCid: cid,
        zkProof: formattedProof
      };
      
      // Store in localStorage for now (in real app, this would be managed by state)
      const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
      existingDocs.push(legalDocument);
      localStorage.setItem('legal_documents', JSON.stringify(existingDocs));
      
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
            <Button onClick={handleNotarize} loading={loading}>
              Notarize Document
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
