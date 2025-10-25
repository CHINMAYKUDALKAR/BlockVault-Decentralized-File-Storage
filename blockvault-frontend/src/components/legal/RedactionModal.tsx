import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ZKCircuitManager, DocumentTransformer } from '../../utils/zkCircuits';
import toast from 'react-hot-toast';

interface RedactionModalProps {
  document: {
    file_id: string;
    name: string;
    cid: string;
    docHash: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const RedactionModal: React.FC<RedactionModalProps> = ({ document, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'configure' | 'processing' | 'verifying' | 'complete'>('configure');
  const [redactionRules, setRedactionRules] = useState({
    removeChunks: [] as number[],
    replaceWith: 0,
    customRules: ''
  });
  const [transformedHash, setTransformedHash] = useState<string>('');

  const handleRedactionRuleChange = (rule: string, value: any) => {
    setRedactionRules(prev => ({
      ...prev,
      [rule]: value
    }));
  };

  const handleCreateRedaction = async () => {
    setLoading(true);
    setStep('processing');

    try {
      // 1. Get original document data (placeholder - in real implementation)
      const originalData = await getDocumentData(document.cid);
      setStep('verifying');

      // 2. Perform redaction
      const redactedData = DocumentTransformer.performToyRedaction(originalData, {
        removeChunks: redactionRules.removeChunks,
        replaceWith: redactionRules.replaceWith
      });

      // 3. Calculate hashes
      const zkManager = ZKCircuitManager.getInstance();
      const originalHash = await zkManager.poseidonHash(originalData);
      const transformedHash = await zkManager.poseidonHash(redactedData);
      setTransformedHash(transformedHash);

      // 4. Generate ZKPT proof
      const { proof, publicSignals } = await zkManager.generateZKPTProof(
        originalData,
        redactedData,
        originalHash,
        transformedHash
      );

      // 5. Format proof for smart contract
      const formattedProof = await zkManager.formatProofForContract(proof, publicSignals);

      // 6. Upload redacted document to IPFS
      const redactedCid = await uploadRedactedDocument(redactedData);

      // 7. Register transformation on blockchain
      await registerTransformationOnChain(redactedCid, formattedProof);

      // 8. Add redacted document to legal documents list
      await addRedactedDocumentToLegalList(redactedCid, transformedHash, formattedProof);

      setStep('complete');
      toast.success('Verifiable redaction created and linked on-chain!');
      onSuccess();

    } catch (error) {
      console.error('Error creating redaction:', error);
      toast.error('An error occurred during redaction creation.');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder functions
  const getDocumentData = async (cid: string): Promise<Uint8Array> => {
    // Simulate getting document data from IPFS
    await new Promise(resolve => setTimeout(resolve, 1000));
    return new Uint8Array(1024).fill(1); // Mock data
  };

  const uploadRedactedDocument = async (data: Uint8Array): Promise<string> => {
    // Simulate IPFS upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `Qm${Math.random().toString(36).substring(2, 15)}`;
  };

  const registerTransformationOnChain = async (cid: string, proof: any) => {
    // Simulate smart contract call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Transformation registered on chain:', { cid, proof });
  };

  const addRedactedDocumentToLegalList = async (cid: string, hash: string, proof: any) => {
    // Create redacted document entry
    const redactedDocument = {
      id: Date.now().toString(),
      file_id: Date.now().toString(),
      name: `Redacted_${document.name}`,
      docHash: hash,
      cid: cid,
      status: 'registered' as const,
      timestamp: Date.now(),
      owner: 'current-user', // This should be the actual user address
      blockchainHash: hash,
      ipfsCid: cid,
      zkProof: proof,
      parentHash: document.docHash, // Link to original document
      transformationType: 'redaction',
      redactionRules: redactionRules,
      originalDocumentId: document.file_id
    };

    // Add to localStorage
    const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
    existingDocs.push(redactedDocument);
    localStorage.setItem('legal_documents', JSON.stringify(existingDocs));

    // Add chain of custody entry for the redaction
    const chainEntry = {
      id: `redact_${redactedDocument.id}`,
      documentId: redactedDocument.file_id,
      documentName: redactedDocument.name,
      action: 'Document Redacted',
      timestamp: redactedDocument.timestamp,
      user: redactedDocument.owner,
      details: `Document redacted using ZKPT protocol. Rules: ${JSON.stringify(redactedDocument.redactionRules)}`,
      type: 'transformation',
      transformationType: 'redaction',
      parentHash: redactedDocument.parentHash,
      originalDocumentId: redactedDocument.originalDocumentId,
      hash: redactedDocument.docHash,
      cid: redactedDocument.cid
    };

    // Add to chain of custody in localStorage
    const existingChain = JSON.parse(localStorage.getItem('chain_of_custody') || '[]');
    existingChain.push(chainEntry);
    localStorage.setItem('chain_of_custody', JSON.stringify(existingChain));

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('legalDocumentsUpdated'));
    window.dispatchEvent(new CustomEvent('chainOfCustodyUpdated'));

    console.log('Redacted document added to legal documents list:', redactedDocument);
    console.log('Chain of custody entry added:', chainEntry);
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
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Create Verifiable Redaction</h2>
              <p className="text-sm text-slate-400">ZKPT: Zero-Knowledge Proof of Transformation</p>
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
              {getStepIcon('configure')}
              <span className="text-sm text-slate-400">Configure</span>
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
        {step === 'configure' && (
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Original Document</h3>
              <p className="text-sm text-slate-400">{document.name}</p>
              <p className="text-xs text-slate-500 font-mono">{document.docHash}</p>
            </div>

            {/* Redaction Rules */}
            <div className="space-y-4">
              <h3 className="font-medium text-white">Redaction Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chunks to Remove (comma-separated indices)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 1,3,5"
                  value={redactionRules.removeChunks.join(',')}
                  onChange={(e) => {
                    const chunks = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                    handleRedactionRuleChange('removeChunks', chunks);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Replacement Value (0-255)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="255"
                  value={redactionRules.replaceWith}
                  onChange={(e) => handleRedactionRuleChange('replaceWith', parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Custom Redaction Rules (JSON)
                </label>
                <textarea
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm font-mono"
                  rows={3}
                  placeholder='{"sensitiveData": ["SSN", "Credit Card"], "replaceWith": "[REDACTED]"}'
                  value={redactionRules.customRules}
                  onChange={(e) => handleRedactionRuleChange('customRules', e.target.value)}
                />
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-500 mb-1">ZKPT Notice</h4>
                  <p className="text-sm text-amber-200">
                    This will create a verifiable transformation that proves the redacted document 
                    was derived from the original without revealing the redacted content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Processing Redaction</h3>
            <p className="text-slate-400">
              Applying redaction rules and preparing for ZK proof generation...
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Generating ZKPT Proof</h3>
            <p className="text-slate-400">
              Creating cryptographic proof of transformation...
            </p>
            {transformedHash && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Transformed Document Hash:</p>
                <p className="text-xs font-mono text-white break-all">{transformedHash}</p>
              </div>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Redaction Created!</h3>
            <p className="text-slate-400 mb-4">
              Your verifiable redaction has been successfully created and linked to the original document.
            </p>
            {transformedHash && (
              <div className="p-3 bg-slate-800/50 rounded-lg mb-4">
                <p className="text-xs text-slate-400 mb-1">Transformed Document Hash:</p>
                <p className="text-xs font-mono text-white break-all">{transformedHash}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} variant="outline">
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'configure' && (
            <Button onClick={handleCreateRedaction} loading={loading}>
              Create Verifiable Redaction
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
