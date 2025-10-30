import React, { useState } from 'react';
import { X, XCircle, AlertTriangle, FileX } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { contractService, getSigner, formatDocHash } from '../../utils/contractHelpers';
import toast from 'react-hot-toast';

interface RevokeDocumentModalProps {
  documentHash: string;
  documentName: string;
  documentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const RevokeDocumentModal: React.FC<RevokeDocumentModalProps> = ({
  documentHash,
  documentName,
  documentStatus,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const handleRevoke = async () => {
    if (confirmation.toLowerCase() !== 'revoke') {
      toast.error('Please type REVOKE to confirm');
      return;
    }

    setLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      await contractService.revokeDocument(formatDocHash(documentHash), signer);
      onSuccess();
    } catch (error) {
      console.error('Error revoking document:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card variant="premium" className="w-full max-w-lg animate-scale-in relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-status-error/5 via-transparent to-red-600/5 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-status-error to-red-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <FileX className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-status-error to-red-600 rounded-xl blur-lg opacity-40 animate-glow-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Revoke Document</h3>
                <p className="text-sm text-text-secondary font-medium">Permanently invalidate document</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2.5 text-text-secondary hover:text-white hover:bg-secondary-700/70 transition-all rounded-xl group disabled:opacity-50"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Document Info */}
          <div className="mb-6 p-4 glass rounded-xl border border-secondary-700/30">
            <h4 className="text-sm font-semibold text-text-secondary mb-2">Document to Revoke</h4>
            <p className="text-white font-bold text-lg mb-3">{documentName}</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Current Status:</span>
              <span className="text-white font-semibold capitalize px-3 py-1 bg-secondary-800/50 rounded-full">
                {documentStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="mb-6 p-5 bg-status-error/10 border-2 border-status-error/30 rounded-xl animate-pulse">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-status-error flex-shrink-0 mt-0.5 animate-bounce-subtle" />
              <div>
                <h4 className="text-base font-bold text-status-errorLight mb-2">⚠️ Critical Action</h4>
                <ul className="text-sm text-text-secondary leading-relaxed space-y-1 list-disc list-inside">
                  <li>This action is <strong className="text-white">irreversible</strong></li>
                  <li>The document will be marked as <strong className="text-status-error">REVOKED</strong> on-chain</li>
                  <li>All users will see this document as invalid</li>
                  <li>This action is recorded permanently on the blockchain</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-white mb-3">
              Type <code className="text-status-error bg-status-error/10 px-2 py-1 rounded font-mono">REVOKE</code> to confirm
            </label>
            <Input
              type="text"
              placeholder="Type REVOKE in capital letters"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              variant="premium"
              className="font-mono"
              error={confirmation && confirmation.toLowerCase() !== 'revoke' ? 'Must type REVOKE exactly' : undefined}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={loading || confirmation.toLowerCase() !== 'revoke'}
              loading={loading}
              variant="danger"
              className="flex-1"
            >
              {loading ? 'Revoking...' : 'Revoke Document'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

