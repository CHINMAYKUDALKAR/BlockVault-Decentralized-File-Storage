import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

interface User {
  address: string;
  jwt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => void;
  isConnected: boolean;
  isAuthenticated: boolean;
  isMobile: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isConnected = !!user?.address;
  const isAuthenticated = !!(user?.address && user?.jwt);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    };
    setIsMobile(checkMobile());
  }, []);

  // Check for existing session on mount and validate token
  useEffect(() => {
    const savedUser = localStorage.getItem('blockvault_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Validate token by making a test request
        if (parsedUser.jwt) {
          validateToken(parsedUser.jwt);
        }
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('blockvault_user');
      }
    }
  }, []);

  // Validate JWT token by making a test request
  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${getApiBase()}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        // Token is invalid, clear it
        console.log('Token validation failed, clearing user data');
        setUser(null);
        localStorage.removeItem('blockvault_user');
        toast.error('Session expired. Please login again.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setUser(null);
      localStorage.removeItem('blockvault_user');
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      setUser({ address });
      
      // Save to localStorage
      localStorage.setItem('blockvault_user', JSON.stringify({ address }));
      
      toast.success('Wallet connected successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!user?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get nonce from backend
      const nonceResponse = await fetch(`${getApiBase()}/auth/get_nonce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: user.address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const { nonce } = await nonceResponse.json();

      // Sign message with wallet
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const message = `BlockVault login nonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // Send signature to backend for verification
      const loginResponse = await fetch(`${getApiBase()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: user.address,
          signature,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error('Login failed');
      }

      const { token } = await loginResponse.json();

      // Update user with JWT
      const updatedUser = { ...user, jwt: token };
      setUser(updatedUser);
      
      // Save to localStorage
      localStorage.setItem('blockvault_user', JSON.stringify(updatedUser));
      
      toast.success('Login successful');
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('blockvault_user');
    toast.success('Logged out successfully');
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    connectWallet,
    login,
    logout,
    isConnected,
    isAuthenticated,
    isMobile,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to get API base URL
function getApiBase(): string {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
}
