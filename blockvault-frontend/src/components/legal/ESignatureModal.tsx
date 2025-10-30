import React, { useState } from 'react';
import { PenTool, Users, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ESignatureModalProps {
  document: {
    file_id: string;
    name: string;
    docHash: string;
    status: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const ESignatureModal: React.FC<ESignatureModalProps> = ({ document, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'signing' | 'complete'>('request');
  const [signatureRequest, setSignatureRequest] = useState({
    signers: [] as string[],
    escrowAmount: '',
    deadline: '',
    customMessage: ''
  });
  const [signatureStatus, setSignatureStatus] = useState<{
    required: number;
    completed: number;
    signers: { address: string; signed: boolean; signature?: string }[];
  }>({
    required: 0,
    completed: 0,
    signers: []
  });

  const handleRequestSignatures = async () => {
    setLoading(true);

    try {
      // Validate inputs
      if (signatureRequest.signers.length === 0) {
        toast.error('Please specify at least one signer');
        return;
      }

      if (signatureRequest.deadline && new Date(signatureRequest.deadline) <= new Date()) {
        toast.error('Deadline must be in the future');
        return;
      }

      // API Base URL
      const getApiBase = () => {
        return process.env.REACT_APP_API_URL || 'http://localhost:5000';
      };

      // Auth Headers
      const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
        if (!user.jwt) {
          throw new Error('No authentication token found. Please login again.');
        }
        return {
          'Authorization': `Bearer ${user.jwt}`,
          'Content-Type': 'application/json',
        };
      };

      // Send signature request to backend
      const response = await fetch(`${getApiBase()}/documents/${document.file_id}/request-signature`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          signers: signatureRequest.signers.map(addr => ({
            address: addr,
            name: '',
            email: ''
          })),
          requestedBy: user?.address || '',
          documentName: document.name,
          message: signatureRequest.customMessage || 'Please sign this document',
          expiresAt: signatureRequest.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to request signatures: ${response.status}`);
      }

      await response.json();
      
      setSignatureStatus({
        required: signatureRequest.signers.length,
        completed: 0,
        signers: signatureRequest.signers.map(addr => ({ address: addr, signed: false }))
      });

      setStep('signing');
      toast.success('Signature request sent successfully!');

    } catch (error) {
      console.error('Error requesting signatures:', error);
      toast.error('An error occurred while requesting signatures.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet to sign');
      return;
    }

    setLoading(true);

    try {
      // API Base URL
      const getApiBase = () => {
        return process.env.REACT_APP_API_URL || 'http://localhost:5000';
      };

      // Auth Headers
      const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
        if (!user.jwt) {
          throw new Error('No authentication token found. Please login again.');
        }
        return {
          'Authorization': `Bearer ${user.jwt}`,
          'Content-Type': 'application/json',
        };
      };

      // Simulate signing process
      const signature = await signDocumentHash(document.docHash);
      
      // Send signature to backend
      const response = await fetch(`${getApiBase()}/documents/${document.file_id}/sign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          signerAddress: user.address,
          signature: signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sign document: ${response.status}`);
      }

      await response.json();
      
      // Update signature status
      setSignatureStatus(prev => {
        const updatedSigners = prev.signers.map(signer => 
          signer.address.toLowerCase() === user.address?.toLowerCase() 
            ? { ...signer, signed: true, signature }
            : signer
        );
        
        const completed = updatedSigners.filter(s => s.signed).length;
        
        return {
          ...prev,
          completed,
          signers: updatedSigners
        };
      });

      if (signatureStatus.completed + 1 >= signatureStatus.required) {
        setStep('complete');
        toast.success('All signatures collected! Contract executed.');
      } else {
        toast.success('Your signature has been recorded!');
      }

    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('An error occurred while signing.');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder functions
  // const requestSignaturesOnChain = async () => {
  //   // Simulate smart contract call
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   console.log('Signature request sent:', signatureRequest);
  // };

  const signDocumentHash = async (docHash: string): Promise<string> => {
    // Simulate MetaMask signing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  };

  const isSignerRequired = () => {
    if (!user?.address) return false;
    return signatureRequest.signers.some(addr => 
      addr.toLowerCase() === user.address?.toLowerCase()
    );
  };

  const canSign = () => {
    if (!user?.address) return false;
    const signer = signatureStatus.signers.find(s => 
      s.address.toLowerCase() === user.address?.toLowerCase()
    );
    return signer && !signer.signed;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-[999] p-4 py-24 overflow-y-auto">
      <Card variant="premium" className="w-full max-w-2xl shadow-2xl border-primary-500/30 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <PenTool className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">E-Signature & Escrow</h2>
              <p className="text-sm text-slate-400">Secure document signing with smart contract execution</p>
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

        {/* Document Info */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-white mb-2">Document</h3>
          <p className="text-sm text-slate-400">{document.name}</p>
          <p className="text-xs text-slate-500 font-mono">{document.docHash}</p>
        </div>

        {/* Request Signatures */}
        {step === 'request' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Required Signers (comma-separated addresses)
              </label>
              <Input
                type="text"
                placeholder="0x1234..., 0x5678..., 0x9abc..."
                value={signatureRequest.signers.join(', ')}
                onChange={(e) => {
                  const addresses = e.target.value.split(',').map(addr => addr.trim()).filter(addr => addr);
                  setSignatureRequest(prev => ({ ...prev, signers: addresses }));
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Escrow Amount (ETH) - Optional
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.1"
                value={signatureRequest.escrowAmount}
                onChange={(e) => setSignatureRequest(prev => ({ ...prev, escrowAmount: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Signature Deadline
              </label>
              <Input
                type="datetime-local"
                value={signatureRequest.deadline}
                onChange={(e) => setSignatureRequest(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Custom Message (Optional)
              </label>
              <textarea
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                rows={3}
                placeholder="Add a custom message for signers..."
                value={signatureRequest.customMessage}
                onChange={(e) => setSignatureRequest(prev => ({ ...prev, customMessage: e.target.value }))}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-500 mb-1">Smart Contract Escrow</h4>
                  <p className="text-sm text-blue-200">
                    Funds will be locked in escrow until all signatures are collected. 
                    Once complete, funds will be automatically released to the document owner.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signing Status */}
        {step === 'signing' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">Signature Progress</h3>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(signatureStatus.completed / signatureStatus.required) * 100}%` }}
                />
              </div>
              <p className="text-sm text-slate-400">
                {signatureStatus.completed} of {signatureStatus.required} signatures collected
              </p>
            </div>

            <div className="space-y-3">
              {signatureStatus.signers.map((signer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      signer.signed ? 'bg-green-500/20 text-green-500' : 'bg-slate-600 text-slate-400'
                    }`}>
                      {signer.signed ? <CheckCircle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {signer.address.slice(0, 6)}...{signer.address.slice(-4)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {signer.signed ? 'Signed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  {signer.signed && (
                    <div className="text-xs text-green-500 font-mono">
                      {signer.signature?.slice(0, 10)}...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canSign() && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <PenTool className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-green-500">Your Signature Required</h4>
                </div>
                <p className="text-sm text-green-200 mb-3">
                  You are required to sign this document. Click below to sign with your wallet.
                </p>
                <Button onClick={handleSignDocument} loading={loading}>
                  Sign Document
                </Button>
              </div>
            )}

            {!isSignerRequired() && (
              <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4">
                <p className="text-sm text-slate-400">
                  You are not required to sign this document. Waiting for other signers...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Contract Executed!</h3>
            <p className="text-slate-400 mb-4">
              All signatures have been collected and the smart contract has been executed.
            </p>
            {signatureRequest.escrowAmount && (
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400">Escrow Amount Released:</p>
                <p className="text-lg font-semibold text-white">{signatureRequest.escrowAmount} ETH</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} variant="outline">
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'request' && (
            <Button onClick={handleRequestSignatures} loading={loading}>
              Request Signatures
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
