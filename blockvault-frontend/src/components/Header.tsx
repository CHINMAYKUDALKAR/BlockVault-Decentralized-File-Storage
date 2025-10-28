import React, { useState, useEffect } from 'react';
import { Shield, Wallet, LogOut, User, AlertCircle, Key, Scale, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RSAManager } from './RSAManager';
import { MobileWalletModal } from './MobileWalletModal';
import { rsaKeyManager } from '../utils/rsa';
import { getSignatureRequestsForUser } from '../utils/signatureRequestStorage';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, loading, error, connectWallet, login, logout, isConnected, isAuthenticated, isMobile } = useAuth();
  const [showRSAManager, setShowRSAManager] = useState(false);
  const [showMobileWallet, setShowMobileWallet] = useState(false);
  const [hasRSAKeys, setHasRSAKeys] = useState(false);
  const [pendingSignatureRequests, setPendingSignatureRequests] = useState(0);
  const location = useLocation();

  React.useEffect(() => {
    const checkRSAKeys = () => {
      setHasRSAKeys(rsaKeyManager.hasKeyPair());
    };
    
    // Check initially
    checkRSAKeys();
    
    // Listen for storage changes (when RSA keys are generated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blockvault_rsa_keys') {
        checkRSAKeys();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkRSAKeys, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Check for pending signature requests
  React.useEffect(() => {
    const checkPendingRequests = () => {
      if (user?.address) {
        const requests = getSignatureRequestsForUser(user.address);
        const pending = requests.filter(req => req.status === 'pending').length;
        setPendingSignatureRequests(pending);
      }
    };

    checkPendingRequests();

    // Listen for changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blockvault_signature_requests') {
        checkPendingRequests();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(checkPendingRequests, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user?.address]);

  return (
    <>
      <header className="w-full sticky top-0 z-50">
        {/* Glassmorphic Header Background */}
        <div className="relative">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-[#161B22] via-[#161B22]/95 to-[#161B22] backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, #161B22 0%, rgba(22, 27, 34, 0.95) 50%, #161B22 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          />
          
          {/* Accent Divider Line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent animate-pulse" />
          
          {/* Header Content */}
          <div className="relative container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-4 hover:opacity-90 transition-all duration-300 group"
                title="Click to refresh page"
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden premium-shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img 
                    src="/logo.png" 
                    alt="BlockVault Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-400 rounded-2xl flex items-center justify-center hidden animate-glow">
                    <Shield className="w-7 h-7 text-white drop-shadow-lg" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-text-primary font-display tracking-tight">BlockVault</h1>
                  <p className="text-sm text-text-secondary font-medium">Secure File Storage</p>
                </div>
              </button>
            </div>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="flex items-center space-x-2">
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location.pathname === '/dashboard'
                      ? 'bg-accent-400/20 text-accent-400 border border-accent-400/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-secondary-800/50 hover:border hover:border-secondary-600/30'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span>Files</span>
                </Link>
                <Link
                  to="/legal"
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                    location.pathname === '/legal'
                      ? 'bg-accent-400/20 text-accent-400 border border-accent-400/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-secondary-800/50 hover:border hover:border-secondary-600/30'
                  }`}
                >
                  <Scale className="w-5 h-5" />
                  <span>Legal</span>
                  {pendingSignatureRequests > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-status-error text-white text-xs font-bold animate-pulse">
                      {pendingSignatureRequests}
                    </span>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Actions & Wallet Status */}
          <div className="flex items-center space-x-4">
            {!isConnected && (
              <div className="flex items-center space-x-2">
                {!isMobile && (
                  <button
                    onClick={connectWallet}
                    disabled={loading}
                    className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-accent-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                )}
                
                {isMobile && (
                  <button
                    onClick={() => setShowMobileWallet(true)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-accent-400 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-accent-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-500/25"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Connect Mobile Wallet</span>
                  </button>
                )}
              </div>
            )}

            {isConnected && !isAuthenticated && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 glass-premium rounded-xl border border-secondary-600/50">
                  <div className="w-2 h-2 bg-status-success rounded-full animate-pulse"></div>
                  <span className="text-sm text-text-secondary font-mono font-medium">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={login}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-secondary-800 text-text-primary border border-secondary-700 rounded-lg hover:bg-secondary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Signing...' : 'Login'}</span>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-text-secondary hover:text-status-error transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-status-success/10 rounded-lg border border-status-success/20">
                  <div className="w-2 h-2 bg-status-success rounded-full"></div>
                  <span className="text-sm text-status-success font-mono">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => setShowRSAManager(true)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    hasRSAKeys 
                      ? 'bg-status-success/10 text-status-success border border-status-success/30 hover:bg-status-success/20'
                      : 'bg-status-warning/10 text-status-warning border border-status-warning/30 hover:bg-status-warning/20'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>{hasRSAKeys ? 'RSA Keys' : 'Setup RSA'}</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 bg-status-error/10 text-status-error border border-status-error/30 rounded-lg hover:bg-status-error/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-status-error/10 rounded-lg border border-status-error/20">
                <AlertCircle className="w-4 h-4 text-status-error" />
                <span className="text-sm text-status-error">{error}</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      </header>

      {/* RSA Manager Modal */}
      {showRSAManager && (
        <RSAManager onClose={() => setShowRSAManager(false)} />
      )}

      {/* Mobile Wallet Modal */}
      {showMobileWallet && (
        <MobileWalletModal onClose={() => setShowMobileWallet(false)} />
      )}

    </>
  );
};
