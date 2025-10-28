import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle, Lock, CheckCircle, Edit } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { getLegalDocumentKey } from '../../utils/legalDocumentKeys';
import { createSignatureRequest } from '../../utils/signatureRequestStorage';
import toast from 'react-hot-toast';

interface RequestSignatureModalProps {
  document: {
    id: string;
    file_id?: string;
    name: string;
    docHash: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const RequestSignatureModal: React.FC<RequestSignatureModalProps> = ({ 
  document, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [signers, setSigners] = useState<Array<{
    address: string;
    name: string;
    email: string;
  }>>([{ address: '', name: '', email: '' }]);
  const [message, setMessage] = useState('Please review and sign this document');
  const [expiresAt, setExpiresAt] = useState('');
  const [filePassphrase, setFilePassphrase] = useState('');
  const [autoRetrievedKey, setAutoRetrievedKey] = useState(false);
  const [manualKeyEntry, setManualKeyEntry] = useState(false);

  // Auto-retrieve stored passphrase on mount
  useEffect(() => {
    const storedKey = getLegalDocumentKey(document.id);
    if (storedKey) {
      setFilePassphrase(storedKey);
      setAutoRetrievedKey(true);
      console.log('Auto-retrieved encryption key for document:', document.id);
    } else {
      setManualKeyEntry(true);
      console.log('No stored key found, manual entry required for:', document.id);
    }
  }, [document.id]);

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

  const addSigner = () => {
    setSigners(prev => [...prev, { address: '', name: '', email: '' }]);
  };

  const removeSigner = (index: number) => {
    setSigners(prev => prev.filter((_, i) => i !== index));
  };

  const updateSigner = (index: number, field: string, value: string) => {
    setSigners(prev => prev.map((signer, i) => 
      i === index ? { ...signer, [field]: value } : signer
    ));
  };

  const handleSubmit = async () => {
    if (!signers.some(s => s.address.trim())) {
      toast.error('Please add at least one signer');
      return;
    }

    if (!filePassphrase) {
      toast.error('Please enter the file encryption passphrase');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Share the file with each signer so they can view it
      const validSigners = signers.filter(s => s.address.trim());
      let failedShares = 0;
      
      console.log('🔄 Starting file sharing process...');
      console.log('📋 Document to share:', { id: document.id, file_id: document.file_id, name: document.name });
      console.log('👥 Signers:', validSigners);
      console.log('🔑 Passphrase available:', !!filePassphrase);
      
      // Use file_id if available, fallback to id
      const fileIdToShare = document.file_id || document.id;
      console.log('📎 Using file_id for sharing:', fileIdToShare);
      
      const shareErrors: string[] = [];
      
      for (const signer of validSigners) {
        try {
          // Normalize address to lowercase
          const normalizedAddress = signer.address.trim().toLowerCase();
          console.log(`📤 Attempting to share with: ${normalizedAddress}`);
          
          const apiUrl = `${getApiBase()}/files/${fileIdToShare}/share`;
          console.log('🔗 API URL:', apiUrl);
          
          const headers = getAuthHeaders();
          console.log('📋 Headers:', Object.keys(headers));
          
          const body = {
            recipient: normalizedAddress,
            passphrase: filePassphrase,
          };
          console.log('📦 Request body:', { recipient: normalizedAddress, passphrase: '***' });
          
          // Share file using the backend API
          const shareResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (!shareResponse.ok) {
            const errorText = await shareResponse.text();
            console.error(`❌ Failed to share file with ${normalizedAddress}: ${errorText}`);
            
            // Store error for summary (don't show individual errors)
            if (errorText.includes('public key') || errorText.includes('registered')) {
              shareErrors.push(`${normalizedAddress.slice(0, 10)}... hasn't registered RSA keys`);
            } else {
              shareErrors.push(`${normalizedAddress.slice(0, 10)}... ${errorText}`);
            }
            failedShares++;
          } else {
            const shareData = await shareResponse.json();
            console.log(`✅ Successfully shared file with ${normalizedAddress}`, shareData);
          }
        } catch (shareError) {
          console.error(`Error sharing with ${signer.address}:`, shareError);
          shareErrors.push(`${signer.address.slice(0, 10)}... ${(shareError as Error).message}`);
          failedShares++;
        }
      }

      // Show single summary message at the end
      if (failedShares === validSigners.length) {
        // All shares failed
        toast.error(`Failed to share document with all signers. Errors: ${shareErrors.join(', ')}`);
      } else if (failedShares > 0) {
        // Some shares failed
        toast(`⚠️ Shared with ${validSigners.length - failedShares}/${validSigners.length} signers. Failed: ${shareErrors.join(', ')}`, {
          icon: '⚠️',
          duration: 6000,
        });
      }

      // Step 2: Create signature requests (stored locally)
      const expirationTimestamp = expiresAt 
        ? new Date(expiresAt).getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days default

      console.log('Creating signature requests...');
      
      // Create a signature request for each signer
      for (const signer of validSigners) {
        const normalizedAddress = signer.address.trim().toLowerCase();
        createSignatureRequest(
          document.id, // Use the same document.id that was used for sharing
          document.name,
          user?.address?.toLowerCase() || '',
          normalizedAddress,
          message,
          expirationTimestamp
        );
        console.log(`Created signature request for ${normalizedAddress} with documentId: ${document.id}`);
      }

      // Try to persist signature requests on the backend so recipients can fetch them
      try {
        const payload = {
          signers: validSigners.map(s => ({ address: s.address.trim().toLowerCase(), name: s.name || '', email: s.email || '' })),
          requestedBy: user?.address || '',
          documentName: document.name,
          message,
          expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        const serverResp = await fetch(`${getApiBase()}/documents/${document.id}/request-signature`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (serverResp.ok) {
          console.log('✅ Persisted signature requests on backend');
        } else {
          console.warn('⚠️ Backend rejected signature request persistence', await serverResp.text());
        }
      } catch (serverErr) {
        console.warn('⚠️ Could not persist signature requests to backend:', serverErr);
      }

      // Trigger event to update signature request count in header
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'blockvault_signature_requests',
        newValue: localStorage.getItem('blockvault_signature_requests'),
        storageArea: localStorage
      }));
      console.log('Dispatched signature request update event');

      // Show appropriate success message
      if (failedShares === 0) {
        toast.success(`Signature request${validSigners.length > 1 ? 's' : ''} sent successfully! All signers can now view and sign the document.`);
      } else if (failedShares < validSigners.length) {
        toast.success(`Signature request${validSigners.length > 1 ? 's' : ''} sent! Note: ${failedShares} signer(s) may not be able to view the document.`);
      } else {
        toast.error('Signature requests sent, but document sharing failed for all signers. They won\'t be able to view the document.');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error requesting signatures:', error);
      toast.error('Failed to send signature requests');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Request Signatures</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Document Info */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-white mb-2">Document</h3>
            <p className="text-slate-300">{document.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Hash: {document.docHash.slice(0, 10)}...{document.docHash.slice(-10)}
            </p>
          </div>

          {/* File Encryption Passphrase */}
          <div className="mb-6">
            {autoRetrievedKey ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-400">Encryption Key Retrieved</p>
                    <p className="text-xs text-slate-400 mt-1">
                      The document encryption key was automatically retrieved. Signers will be able to view this document.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAutoRetrievedKey(false);
                      setManualKeyEntry(true);
                      setFilePassphrase('');
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Input
                  label="File Encryption Passphrase"
                  type="password"
                  placeholder="Enter the passphrase used to encrypt this file"
                  value={filePassphrase}
                  onChange={(e) => setFilePassphrase(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <p className="text-xs text-slate-400 mt-2">
                  {manualKeyEntry 
                    ? "This document was not uploaded via Legal Dashboard. Please enter the encryption passphrase manually."
                    : "This passphrase will be securely shared with signers so they can view the document before signing."}
                </p>
              </div>
            )}
          </div>

          {/* Signers */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Signers</h3>
              <Button onClick={addSigner} size="sm">
                <Users className="w-4 h-4 mr-2" />
                Add Signer
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-white">Signer {index + 1}</h4>
                    {signers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSigner(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Wallet Address *
                      </label>
                      <input
                        type="text"
                        value={signer.address}
                        onChange={(e) => updateSigner(index, 'address', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0x..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={signer.name}
                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-white mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Message to Signers
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a message for the signers..."
            />
          </div>

          {/* Expiration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Expiration Date
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty for 7 days from now
            </p>
          </div>

          {/* Legal Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-400 mb-1">Legal Notice</h4>
                <p className="text-sm text-amber-200">
                  Requesting signatures creates a legally binding workflow. All signers will be notified 
                  and must sign the document for it to be considered executed.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Sending...' : 'Send Signature Requests'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
