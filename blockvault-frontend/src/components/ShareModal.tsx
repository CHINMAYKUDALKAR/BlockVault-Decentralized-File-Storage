import React, { useState, useEffect, useCallback } from 'react';
import { X, User, Lock, AlertCircle, Copy, Check, Key } from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { rsaKeyManager } from '../utils/rsa';
import toast from 'react-hot-toast';

interface ShareModalProps {
  fileId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ fileId, onClose }) => {
  const { shareFile, loading } = useFiles();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasRSAKeys, setHasRSAKeys] = useState(false);
  const [isPublicKeyRegistered, setIsPublicKeyRegistered] = useState(false);

  const checkRSAStatus = useCallback(async () => {
    const hasKeys = rsaKeyManager.hasKeyPair();
    setHasRSAKeys(hasKeys);

    if (hasKeys) {
      // Check if public key is registered
      try {
        const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
        if (user.jwt) {
          const response = await fetch(`${getApiBase()}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${user.jwt}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setIsPublicKeyRegistered(data.has_public_key);
          }
        }
      } catch (error) {
        console.error('Failed to check RSA registration status:', error);
      }
    }
  }, []);

  useEffect(() => {
    checkRSAStatus();
  }, [checkRSAStatus]);

  const handleShare = async () => {
    if (!recipientAddress || !passphrase) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic Ethereum address validation
    if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    await shareFile(fileId, recipientAddress, passphrase);
    onClose();
  };

  const getApiBase = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    return '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share File</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* RSA Key Requirement */}
          {!hasRSAKeys && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-300">
                  <p className="font-medium mb-1">RSA Keys Required</p>
                  <p>
                    You need to generate and register RSA keys before you can share files. 
                    Click the "Setup RSA" button in the header to get started.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasRSAKeys && !isPublicKeyRegistered && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">Public Key Not Registered</p>
                  <p>
                    Your RSA keys are generated but your public key is not registered on the server. 
                    Please register your public key to enable file sharing.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Important Security Note</p>
                <p>
                  The recipient will need the same passphrase to decrypt the file. 
                  Share the passphrase securely through a separate channel.
                </p>
              </div>
            </div>
          </div>

          <Input
            label="Recipient Address"
            type="text"
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Encryption Passphrase"
            type="password"
            placeholder="Enter the passphrase for this file"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">File ID:</span>
              <div className="flex items-center space-x-2">
                <code className="text-xs font-mono text-slate-300 bg-slate-900/50 px-2 py-1 rounded">
                  {fileId}
                </code>
                <button
                  onClick={() => copyToClipboard(fileId)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={!recipientAddress || !passphrase || loading || !hasRSAKeys || !isPublicKeyRegistered}
              loading={loading}
              className="flex-1"
            >
              Share File
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
