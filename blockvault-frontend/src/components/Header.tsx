import React, { useState, useEffect } from 'react';
import { Shield, Wallet, LogOut, User, AlertCircle, Key, Scale, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ui/ThemeToggle';
import { Tooltip } from './ui/Tooltip';
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
      <header className="w-full sticky top-0 z-50 animate-slide-down shadow-lg dark:shadow-black/30 light:shadow-black/10">
        {/* Glassmorphic Header Background */}
        <div className="relative glass-premium border-b dark:border-primary-500/10 light:border-gray-200">
          {/* Gradient overlay */}
          <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-secondary-900/50 dark:via-secondary-900/80 dark:to-secondary-900/50 light:bg-white backdrop-blur-3xl" />
          
          {/* Full-width subtle border */}
          <div className="absolute bottom-0 left-0 right-0 h-px dark:bg-gradient-to-r dark:from-transparent dark:via-primary-500/30 dark:to-transparent light:bg-gray-200" />
          
          {/* Header Content */}
          <div className="relative container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-4 transition-all duration-300 group"
                title="BlockVault - Click to refresh"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden premium-shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <img 
                      src="/logo.png" 
                      alt="BlockVault Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center hidden shadow-2xl">
                      <Shield className="w-8 h-8 text-white drop-shadow-2xl" />
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white font-display tracking-tight bg-clip-text group-hover:text-gradient transition-all duration-300">
                    BlockVault
                  </h1>
                  <p className="text-sm text-text-secondary font-semibold group-hover:text-primary-400 transition-colors">
                    Secure File Storage
                  </p>
                </div>
              </button>
            </div>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className={`relative flex items-center space-x-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
                    location.pathname === '/dashboard'
                      ? 'bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90 text-white shadow-md'
                      : 'text-text-secondary hover:text-white hover:bg-secondary-700/40'
                  }`}
                >
                  {location.pathname === '/dashboard' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-md opacity-30 -z-10" />
                  )}
                  <Shield className={`w-5 h-5 ${location.pathname === '/dashboard' ? 'drop-shadow-lg' : 'group-hover:scale-110 transition-transform'}`} />
                  <span>Files</span>
                  {location.pathname === '/dashboard' && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-full" />
                  )}
                </Link>
                <Link
                  to="/legal"
                  className={`relative flex items-center space-x-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-300 group ${
                    location.pathname === '/legal'
                      ? 'bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90 text-white shadow-md'
                      : 'text-text-secondary hover:text-white hover:bg-secondary-700/40'
                  }`}
                >
                  {location.pathname === '/legal' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-md opacity-30 -z-10" />
                  )}
                  <Scale className={`w-5 h-5 ${location.pathname === '/legal' ? 'drop-shadow-lg' : 'group-hover:scale-110 transition-transform'}`} />
                  <span>Legal</span>
                  {location.pathname === '/legal' && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-full" />
                  )}
                  {pendingSignatureRequests > 0 && (
                    <div className="relative">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-status-error to-red-600 text-white text-xs font-bold shadow-lg shadow-status-error/50 animate-bounce-subtle">
                        {pendingSignatureRequests}
                      </span>
                      <span className="absolute inset-0 rounded-full bg-status-error animate-ping opacity-75" />
                    </div>
                  )}
                </Link>
              </nav>
            )}
          </div>

          {/* Actions & Wallet Status */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {!isConnected && (
              <div className="flex items-center space-x-3 animate-fade-in">
                {!isMobile && (
                  <button
                    onClick={connectWallet}
                    disabled={loading}
                    className="relative flex items-center space-x-3 px-6 py-3.5 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 active:scale-95 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Wallet className="w-5 h-5 relative z-10 drop-shadow-lg" />
                    <span className="relative z-10">Connect Wallet</span>
                  </button>
                )}
                
                {isMobile && (
                  <button
                    onClick={() => setShowMobileWallet(true)}
                    disabled={loading}
                    className="relative flex items-center space-x-3 px-6 py-3.5 bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white rounded-xl font-bold hover:from-primary-600 hover:via-primary-700 hover:to-accent-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 active:scale-95 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <Smartphone className="w-5 h-5 relative z-10 drop-shadow-lg" />
                    <span className="relative z-10">Connect Mobile</span>
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
              <div className="flex items-center space-x-3 animate-fade-in">
                <div className="flex items-center space-x-3 px-4 py-2.5 glass-premium rounded-xl border border-status-success/30 shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-status-success rounded-full shadow-lg shadow-status-success/50 animate-pulse"></div>
                    <div className="absolute inset-0 bg-status-success rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm text-white font-mono font-bold tracking-wider">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </div>
                <button
                  onClick={() => setShowRSAManager(true)}
                  className={`relative flex items-center space-x-2.5 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-lg group overflow-hidden ${
                    hasRSAKeys 
                      ? 'bg-gradient-to-r from-status-success/20 to-status-successLight/20 text-status-successLight border border-status-success/40 hover:from-status-success/30 hover:to-status-successLight/30 hover:shadow-status-success/30'
                      : 'bg-gradient-to-r from-status-warning/20 to-status-warningLight/20 text-status-warningLight border border-status-warning/40 hover:from-status-warning/30 hover:to-status-warningLight/30 hover:shadow-status-warning/30 animate-bounce-subtle'
                  }`}
                >
                  <Key className={`w-4 h-4 ${!hasRSAKeys && 'animate-wiggle'}`} />
                  <span className="text-sm">{hasRSAKeys ? 'RSA Keys' : 'Setup RSA'}</span>
                </button>
                <Tooltip content="Disconnect wallet">
                  <button
                    onClick={logout}
                    className="relative flex items-center space-x-2.5 px-4 py-2.5 bg-gradient-to-r from-status-error/15 to-red-600/15 text-status-errorLight border border-status-error/40 rounded-xl font-bold hover:from-status-error/25 hover:to-red-600/25 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-status-error/20 group overflow-hidden"
                  >
                    <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-sm">Logout</span>
                  </button>
                </Tooltip>
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
