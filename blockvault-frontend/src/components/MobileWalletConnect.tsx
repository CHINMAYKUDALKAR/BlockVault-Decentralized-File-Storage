import React, { useState, useEffect } from 'react';

interface MobileWalletConnectProps {
  onConnect: (address: string, provider: any) => void;
  onError: (error: string) => void;
}

export const MobileWalletConnect: React.FC<MobileWalletConnectProps> = ({
  onConnect,
  onError,
}) => {
  // const [provider, setProvider] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if user is on mobile
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    };
    setIsMobile(checkMobile());
  }, []);

  const connectWalletConnect = async () => {
    try {
      setIsConnecting(true);
      onError('WalletConnect integration requires setup. Please use MetaMask, Trust Wallet, or Coinbase Wallet for now.');
    } catch (error: any) {
      console.error('WalletConnect error:', error);
      onError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    try {
      setIsConnecting(true);

      // Wait a bit for wallet to load if redirected
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0], window.ethereum);
        } else {
          onError('No accounts found. Please make sure your wallet is unlocked.');
        }
      } else {
        // Try to open MetaMask app
        const metamaskUrl = 'metamask://dapp/' + window.location.host;
        window.location.href = metamaskUrl;
        
        // Wait for user to return and try again
        setTimeout(async () => {
          if (typeof window.ethereum !== 'undefined') {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              
              if (accounts && accounts.length > 0) {
                onConnect(accounts[0], window.ethereum);
              }
            } catch (error: any) {
              onError('Please connect your wallet in the MetaMask app and return to this page.');
            }
          } else {
            onError('MetaMask not detected. Please install MetaMask mobile app.');
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('MetaMask error:', error);
      onError(error.message || 'Failed to connect MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectTrustWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Try to open Trust Wallet app
      const trustUrl = 'trust://open_url?url=' + encodeURIComponent(window.location.href);
      window.location.href = trustUrl;
      
      // Fallback: try to detect if Trust Wallet is available
      if (typeof window.ethereum !== 'undefined' && (window.ethereum as any).isTrust) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0], window.ethereum);
        }
      }
    } catch (error: any) {
      console.error('Trust Wallet error:', error);
      onError(error.message || 'Failed to connect Trust Wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectCoinbaseWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Try to open Coinbase Wallet app
      const coinbaseUrl = 'cbwallet://dapp/' + window.location.host;
      window.location.href = coinbaseUrl;
      
      // Fallback: try to detect if Coinbase Wallet is available
      if (typeof window.ethereum !== 'undefined' && (window.ethereum as any).isCoinbaseWallet) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0], window.ethereum);
        }
      }
    } catch (error: any) {
      console.error('Coinbase Wallet error:', error);
      onError(error.message || 'Failed to connect Coinbase Wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isMobile) {
    return null; // Don't show mobile options on desktop
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-200 mb-2">
          Connect Mobile Wallet
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Choose your preferred mobile wallet to connect
        </p>
      </div>

      <div className="space-y-3">
        {/* WalletConnect - Universal QR Code */}
        <button
          onClick={connectWalletConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-xs">WC</span>
          </div>
          <span>WalletConnect (Universal)</span>
        </button>

        {/* MetaMask Mobile */}
        <button
          onClick={connectMetaMask}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold text-xs">M</span>
          </div>
          <span>MetaMask Mobile</span>
        </button>

        {/* Trust Wallet */}
        <button
          onClick={connectTrustWallet}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-500 font-bold text-xs">T</span>
          </div>
          <span>Trust Wallet</span>
        </button>

        {/* Coinbase Wallet */}
        <button
          onClick={connectCoinbaseWallet}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-900 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-xs">C</span>
          </div>
          <span>Coinbase Wallet</span>
        </button>
      </div>

      {isConnecting && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-sm text-slate-400 mt-2">Connecting...</p>
        </div>
      )}
    </div>
  );
};
