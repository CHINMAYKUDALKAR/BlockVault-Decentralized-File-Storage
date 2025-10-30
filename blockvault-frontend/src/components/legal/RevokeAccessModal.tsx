import React, { useState, useEffect } from 'react';
import { X, UserMinus, AlertTriangle, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { contractService, getSigner, formatDocHash } from '../../utils/contractHelpers';
import toast from 'react-hot-toast';

interface RevokeAccessModalProps {
  documentHash: string;
  documentName: string;
  accessList: string[]; // List of addresses with access
  onClose: () => void;
  onSuccess: () => void;
}

export const RevokeAccessModal: React.FC<RevokeAccessModalProps> = ({
  documentHash,
  documentName,
  accessList,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [verifiedAccess, setVerifiedAccess] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Verify each address actually has access on-chain
    const verifyAccess = async () => {
      const verified: { [key: string]: boolean } = {};
      for (const address of accessList) {
        const hasAccess = await contractService.hasPermission(formatDocHash(documentHash), address);
        verified[address] = hasAccess;
      }
      setVerifiedAccess(verified);
    };
    verifyAccess();
  }, [documentHash, accessList]);

  const handleRevoke = async () => {
    if (!selectedAddress) {
      toast.error('Please select an address to revoke');
      return;
    }

    setLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      await contractService.revokeAccess(formatDocHash(documentHash), selectedAddress, signer);
      onSuccess();
    } catch (error) {
      console.error('Error revoking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const addressesWithAccess = accessList.filter(addr => verifiedAccess[addr]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-start justify-center z-[999] p-4 py-24 overflow-y-auto animate-fade-in">
      <Card variant="premium" className="w-full max-w-2xl animate-scale-in relative shadow-2xl border-primary-500/30">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                  <UserMinus className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-lg opacity-40 animate-glow-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Revoke Access</h3>
                <p className="text-sm text-text-secondary font-medium">Manage document permissions</p>
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
            <h4 className="text-sm font-semibold text-text-secondary mb-2">Document</h4>
            <p className="text-white font-bold text-lg">{documentName}</p>
          </div>

          {/* Access List */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-5 h-5 text-primary-400" />
              <h4 className="text-sm font-bold text-white">Users with Access</h4>
              <span className="text-xs text-text-secondary">
                ({addressesWithAccess.length} total)
              </span>
            </div>

            {addressesWithAccess.length === 0 ? (
              <div className="text-center py-8 glass rounded-xl border border-secondary-700/30">
                <p className="text-text-secondary">No users have been granted access</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {addressesWithAccess.map((address) => (
                  <button
                    key={address}
                    onClick={() => setSelectedAddress(address)}
                    disabled={loading}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                      selectedAddress === address
                        ? 'bg-gradient-to-r from-status-error/20 to-red-600/20 border-2 border-status-error/50'
                        : 'glass border border-secondary-700/30 hover:border-primary-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedAddress === address ? 'bg-status-error' : 'bg-status-success'
                        } animate-pulse`} />
                        <code className="text-white font-mono text-sm font-medium">
                          {address.slice(0, 10)}...{address.slice(-8)}
                        </code>
                      </div>
                      {selectedAddress === address && (
                        <span className="text-xs font-bold text-status-error uppercase tracking-wider">
                          Selected
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          {selectedAddress && (
            <div className="mb-6 p-4 bg-status-error/5 border border-status-error/20 rounded-xl animate-slide-down">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-status-errorLight mb-1">Warning</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    This will permanently revoke access for the selected user. They will no longer be able to view or interact with this document.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || !selectedAddress}
              loading={loading}
              variant="danger"
              className="flex-1"
            >
              {loading ? 'Revoking...' : 'Revoke Access'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

