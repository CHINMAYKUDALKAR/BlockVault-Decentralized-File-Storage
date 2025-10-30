import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { contractService, getSigner, formatDocHash } from '../../utils/contractHelpers';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface CancelSignatureModalProps {
  documentHash: string;
  documentName: string;
  deadline: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelSignatureModal: React.FC<CancelSignatureModalProps> = ({
  documentHash,
  documentName,
  deadline,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [escrowAmount, setEscrowAmount] = useState<string>('0');

  useEffect(() => {
    const loadEscrowAmount = async () => {
      try {
        const amount = await contractService.getEscrowAmount(formatDocHash(documentHash));
        setEscrowAmount(ethers.formatEther(amount));
      } catch (error) {
        console.error('Error loading escrow amount:', error);
      }
    };
    loadEscrowAmount();
  }, [documentHash]);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      await contractService.cancelSignatureRequest(formatDocHash(documentHash), signer);
      onSuccess();
    } catch (error) {
      console.error('Error cancelling signature request:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPastDeadline = Date.now() > deadline;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card variant="premium" className="w-full max-w-lg animate-scale-in relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-status-warning/5 via-transparent to-status-error/5 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-status-warning to-status-warningLight rounded-xl flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-status-warning to-status-warningLight rounded-xl blur-lg opacity-40 animate-glow-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Cancel Signature Request</h3>
                <p className="text-sm text-text-secondary font-medium">Reclaim escrowed funds</p>
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
            <p className="text-white font-medium mb-3">{documentName}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Status:</span>
                <span className={`font-bold ${isPastDeadline ? 'text-status-error' : 'text-status-warning'}`}>
                  {isPastDeadline ? 'Deadline Passed' : 'Awaiting Signatures'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Deadline:</span>
                <span className="text-white font-mono text-xs">
                  {new Date(deadline).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Escrow Info */}
          {parseFloat(escrowAmount) > 0 && (
            <div className="mb-6 p-4 bg-status-success/5 border border-status-success/20 rounded-xl">
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className="w-5 h-5 text-status-success" />
                <h4 className="text-sm font-bold text-status-successLight">Escrow Refund</h4>
              </div>
              <p className="text-2xl font-bold text-status-success mb-1">
                {escrowAmount} ETH
              </p>
              <p className="text-xs text-text-secondary">
                This amount will be refunded to your wallet
              </p>
            </div>
          )}

          {/* Warning */}
          <div className="mb-6 p-4 bg-status-warning/5 border border-status-warning/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-status-warningLight mb-1">Important</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {isPastDeadline
                    ? 'The deadline has passed. You can now cancel the request and reclaim any escrowed funds.'
                    : 'You can only cancel signature requests after the deadline has passed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={handleCancel}
              disabled={loading || !isPastDeadline}
              loading={loading}
              variant="primary"
              className="flex-1"
            >
              {loading ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>

          {!isPastDeadline && (
            <p className="text-xs text-text-tertiary text-center mt-4">
              Please wait until after the deadline to cancel
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

