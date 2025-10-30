import React, { useState } from 'react';
import { Wallet, ArrowRight, Shield, Brain, Lock, Share2, FileCheck } from 'lucide-react';
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

  const features = [
    {
      icon: FileCheck,
      title: 'Verifiable Redaction',
      description: 'ZKPT-powered document privacy',
      color: 'from-blue-500 to-purple-500'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Cryptographic proof validation',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Lock,
      title: 'Role-Based Access',
      description: 'Granular permission control',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Shield,
      title: 'Chain of Custody',
      description: 'Blockchain-anchored tracking',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Share2,
      title: 'Secure Sharing',
      description: 'End-to-end encryption',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card variant="premium" className="w-full max-w-2xl relative animate-fade-in-up border-primary-500/20">
        <div className="p-10 text-center">
          {/* Logo Icon */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <Wallet className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-black text-white mb-4 text-gradient animate-fade-in">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">BlockVault Legal</span>
          </h1>
          
          {/* Description */}
          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Connect your wallet to access the most secure legal document management platform powered by <span className="text-primary-400 font-semibold">zero-knowledge proofs</span> and <span className="text-accent-400 font-semibold">blockchain verification</span>.
          </p>

          {/* Connect Button - Premium */}
          <div className="relative w-full max-w-md mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse"></div>
            
            {/* Button */}
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="relative w-full group overflow-hidden rounded-2xl"
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 animate-gradient bg-[length:200%_100%]"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]"></div>
              </div>
              
              {/* Content */}
              <div className="relative flex items-center justify-center px-8 py-5 text-lg font-bold text-white transform group-hover:scale-[1.02] transition-transform duration-300">
                {connecting ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 border-4 border-white/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <span className="animate-pulse">Connecting Wallet...</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="tracking-wide">Connect Wallet</span>
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
              </div>
              
              {/* Bottom shine */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            </button>
            
            {/* Helper text */}
            <p className="mt-3 text-center text-xs text-slate-400">
              MetaMask or WalletConnect compatible
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group glass rounded-xl p-4 hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-3 mx-auto group-hover:rotate-12 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-xs text-slate-500 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            🔒 Secure • 🌐 Decentralized • 🚀 Lightning Fast
          </p>
        </div>
      </Card>
    </div>
  );
};
