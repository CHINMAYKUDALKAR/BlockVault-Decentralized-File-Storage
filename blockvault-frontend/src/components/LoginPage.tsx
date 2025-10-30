import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Globe, Zap, ArrowRight, CheckCircle, Smartphone, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileWalletModal } from './MobileWalletModal';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isMobile, connectWallet, login, loading, error, isConnected, user } = useAuth();
  const [showMobileWallet, setShowMobileWallet] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description: "Your files are encrypted before leaving your device"
    },
    {
      icon: Lock,
      title: "Web3 Security",
      description: "Blockchain-based authentication and access control"
    },
    {
      icon: Globe,
      title: "IPFS Storage",
      description: "Decentralized storage across the global network"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Quick upload and download with optimized performance"
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">BlockVault</h1>
              </div>
              
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Secure Your
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent block">
                  Digital Files
                </span>
              </h2>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                The most secure way to store, share, and manage your files with 
                blockchain technology and end-to-end encryption.
              </p>
            </div>

            {/* Features Carousel */}
            <div className="mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    {React.createElement(features[currentFeature].icon, { className: "w-6 h-6 text-white" })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {features[currentFeature].title}
                    </h3>
                    <p className="text-slate-400">
                      {features[currentFeature].description}
                    </p>
                  </div>
                </div>
                
                {/* Feature Indicators */}
                <div className="flex space-x-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature 
                          ? 'bg-blue-500 w-8' 
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">256-bit</div>
                <div className="text-sm text-slate-400">Encryption</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">∞</div>
                <div className="text-sm text-slate-400">Storage</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md p-8 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
                <p className="text-slate-400">
                  {isMobile ? 'Connect your mobile wallet to continue' : 'Connect your wallet to get started'}
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Login Options */}
              <div className="space-y-4">
                {!isConnected ? (
                  !isMobile ? (
                    <Button
                      onClick={connectWallet}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Wallet className="w-5 h-5" />
                          <span>Connect Wallet</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowMobileWallet(true)}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Smartphone className="w-5 h-5" />
                          <span>Connect Mobile Wallet</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-700/50">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-slate-300 font-mono">
                        {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                      </span>
                    </div>
                    <Button
                      onClick={login}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Signing Message...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Complete Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  </div>
                )}

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Web3 authentication</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Decentralized storage</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Secure file sharing</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center">
                  Powered by blockchain technology • No data collection • Privacy first
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Wallet Modal */}
      {showMobileWallet && (
        <MobileWalletModal onClose={() => setShowMobileWallet(false)} />
      )}

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 border-t border-primary-500/10 bg-slate-900/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-text-secondary">
              Made with{' '}
              <span className="inline-block animate-pulse text-status-error drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                ❤️
              </span>{' '}
              in India 🇮🇳
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
