import React, { useState } from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface WalletConnectionProps {
  onConnect: (address: string) => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnect }) => {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast.error('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        onConnect(address);
        toast.success('Wallet connected successfully!');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Please connect your wallet to continue.');
      } else {
        toast.error('Failed to connect wallet. Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Welcome to BlockVault Legal
          </h1>
          
          <p className="text-slate-400 mb-8">
            Connect your wallet to access secure legal document management with zero-knowledge proofs and blockchain verification.
          </p>

          <Button
            onClick={connectWallet}
            disabled={connecting}
            className="w-full"
            size="lg"
          >
            {connecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-2">Features:</h3>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Verifiable document redaction (ZKPT)</li>
              <li>• AI analysis with cryptographic proofs (ZKML)</li>
              <li>• Role-based access control</li>
              <li>• Blockchain-anchored chain of custody</li>
              <li>• Secure document sharing</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
