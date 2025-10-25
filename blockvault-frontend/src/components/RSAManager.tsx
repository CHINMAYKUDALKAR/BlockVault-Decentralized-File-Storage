import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Key, Shield, AlertCircle, CheckCircle, Download, Trash2 } from 'lucide-react';
import { rsaKeyManager } from '../utils/rsa';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import toast from 'react-hot-toast';

interface RSAManagerProps {
  onClose: () => void;
}

export const RSAManager: React.FC<RSAManagerProps> = ({ onClose }) => {
  const [hasKeys, setHasKeys] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const checkRegistrationStatus = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
      if (!user.jwt) return;

      const response = await fetch(`${getApiBase()}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${user.jwt}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.has_public_key);
      }
    } catch (error) {
      console.error('Failed to check registration status:', error);
    }
  }, []);

  const checkKeyStatus = useCallback(async () => {
    const hasLocalKeys = rsaKeyManager.hasKeyPair();
    setHasKeys(hasLocalKeys);
    
    if (hasLocalKeys) {
      const keyPair = rsaKeyManager.getKeyPair();
      setPublicKey(keyPair?.publicKey || null);
      
      // Check if public key is registered on server
      await checkRegistrationStatus();
    }
  }, [checkRegistrationStatus]);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const generateKeys = async () => {
    try {
      setLoading(true);
      const keyPair = rsaKeyManager.generateKeyPair();
      setHasKeys(true);
      setPublicKey(keyPair.publicKey);
      setIsRegistered(false);
      toast.success('RSA key pair generated successfully');
    } catch (error) {
      toast.error('Failed to generate RSA keys');
    } finally {
      setLoading(false);
    }
  };

  const registerPublicKey = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
      if (!user.jwt) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch(`${getApiBase()}/users/public_key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_key_pem: publicKey,
        }),
      });

      if (response.ok) {
        setIsRegistered(true);
        toast.success('Public key registered successfully');
      } else {
        const error = await response.text();
        toast.error(`Failed to register public key: ${error}`);
      }
    } catch (error) {
      toast.error('Failed to register public key');
    } finally {
      setLoading(false);
    }
  };

  const deleteKeys = () => {
    if (window.confirm('Are you sure you want to delete your RSA keys? This will prevent you from sharing files.')) {
      rsaKeyManager.clearKeyPair();
      setHasKeys(false);
      setPublicKey(null);
      setIsRegistered(false);
      toast.success('RSA keys deleted');
    }
  };

  const downloadKeys = () => {
    const keyPair = rsaKeyManager.getKeyPair();
    if (!keyPair) return;

    const data = {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blockvault-rsa-keys.json';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('RSA keys downloaded');
  };

  const getApiBase = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Card className="w-full max-w-2xl mx-auto relative z-[100000]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">RSA Key Management</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
            {hasKeys ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {hasKeys ? 'RSA Keys Generated' : 'No RSA Keys Found'}
              </p>
              <p className="text-xs text-slate-400">
                {hasKeys 
                  ? (isRegistered ? 'Public key registered on server' : 'Public key not registered')
                  : 'Generate RSA keys to enable file sharing'
                }
              </p>
            </div>
          </div>

          {/* Key Generation */}
          {!hasKeys && (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Generate RSA Keys</h3>
              <p className="text-slate-400 mb-6">
                RSA keys are required for secure file sharing. Your private key stays on your device, 
                while your public key is registered on the server.
              </p>
              <Button
                onClick={generateKeys}
                loading={loading}
                leftIcon={<Key className="w-4 h-4" />}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Generate RSA Keys
              </Button>
            </div>
          )}

          {/* Key Management */}
          {hasKeys && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <h4 className="font-medium text-white mb-2">Public Key</h4>
                <div className="bg-slate-900/50 p-3 rounded border font-mono text-xs text-slate-300 break-all">
                  {publicKey?.substring(0, 100)}...
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isRegistered && (
                  <Button
                    onClick={registerPublicKey}
                    loading={loading}
                    leftIcon={<Shield className="w-4 h-4" />}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Register Public Key
                  </Button>
                )}

                <Button
                  onClick={downloadKeys}
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Keys
                </Button>

                <Button
                  onClick={deleteKeys}
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Delete Keys
                </Button>
              </div>

              {isRegistered && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-300">
                      Public key is registered and ready for file sharing
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Security Notice</p>
                <p>
                  Your private key is stored locally and never sent to the server. 
                  Keep your private key secure and never share it with anyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
};
