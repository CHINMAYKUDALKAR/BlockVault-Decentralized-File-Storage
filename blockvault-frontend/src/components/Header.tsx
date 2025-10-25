import React, { useState } from 'react';
import { Shield, Wallet, LogOut, User, AlertCircle, Key, Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RSAManager } from './RSAManager';
import { rsaKeyManager } from '../utils/rsa';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, loading, error, connectWallet, login, logout, isConnected, isAuthenticated } = useAuth();
  const [showRSAManager, setShowRSAManager] = useState(false);
  const [hasRSAKeys, setHasRSAKeys] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setHasRSAKeys(rsaKeyManager.hasKeyPair());
  }, []);

  return (
    <header className="w-full bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BlockVault</h1>
                <p className="text-xs text-slate-400">Secure File Storage</p>
              </div>
            </div>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="flex items-center space-x-1">
                <Link
                  to="/"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Files</span>
                </Link>
                <Link
                  to="/legal"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/legal'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>Legal</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Wallet Status & Actions */}
          <div className="flex items-center space-x-4">
            {!isConnected && (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}

            {isConnected && !isAuthenticated && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300 font-mono">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={login}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Signing...' : 'Login'}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-300 font-mono">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => setShowRSAManager(true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    hasRSAKeys 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>{hasRSAKeys ? 'RSA Keys' : 'Setup RSA'}</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RSA Manager Modal */}
      {showRSAManager && (
        <RSAManager onClose={() => setShowRSAManager(false)} />
      )}
    </header>
  );
};
