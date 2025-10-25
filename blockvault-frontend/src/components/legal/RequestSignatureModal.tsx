import React, { useState } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RequestSignatureModalProps {
  document: {
    id: string;
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

    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/documents/${document.id}/request-signature`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          signers: signers.filter(s => s.address.trim()),
          requestedBy: user?.address || '',
          documentName: document.name,
          message,
          expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to request signatures: ${response.status}`);
      }

      await response.json();
      toast.success('Signature requests sent successfully!');
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
