import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MobileWalletConnect } from './MobileWalletConnect';
// import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface MobileWalletModalProps {
  onClose: () => void;
}

export const MobileWalletModal: React.FC<MobileWalletModalProps> = ({
  onClose,
}) => {
  const { setUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = async (address: string, provider: any) => {
    try {
      setIsConnecting(true);
      
      // Create user object
      const user = { address };
      setUser(user);
      
      // Save to localStorage
      localStorage.setItem('blockvault_user', JSON.stringify(user));
      
      toast.success('Wallet connected successfully!');
      onClose();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleError = (error: string) => {
    toast.error(error);
  };


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-200">
              Connect Mobile Wallet
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <MobileWalletConnect
            onConnect={handleWalletConnect}
            onError={handleError}
          />

          {isConnecting && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-sm text-slate-400 mt-2">Connecting wallet...</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don't have a wallet? Download MetaMask, Trust Wallet, or Coinbase Wallet from your app store.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
