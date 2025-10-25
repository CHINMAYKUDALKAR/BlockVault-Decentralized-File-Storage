import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface File {
  id: string;
  file_id?: string;
  name?: string;
  file_name?: string;
  size?: number;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at?: string;
  folder?: string;
  is_shared?: boolean;
}

interface Share {
  id: string;
  file_id: string;
  file_name: string;
  shared_with: string;
  created_at: string;
  expires_at?: string;
}

interface FileContextType {
  files: File[];
  sharedFiles: File[];
  outgoingShares: Share[];
  loading: boolean;
  error: string | null;
  uploadFile: (file: any, passphrase: string, aad?: string, folder?: string) => Promise<void>;
  downloadFile: (fileId: string, passphrase: string, isSharedFile?: boolean, encryptedKey?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  shareFile: (fileId: string, recipientAddress: string, passphrase: string) => Promise<void>;
  revokeShare: (shareId: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
  refreshSharedFiles: () => Promise<void>;
  refreshOutgoingShares: () => Promise<void>;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (context === undefined) {
    throw new Error('useFiles must be used within a FileProvider');
  }
  return context;
};

interface FileProviderProps {
  children: ReactNode;
}

export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);
  const [outgoingShares, setOutgoingShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    return '';
  };

  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    if (!user.jwt) {
      throw new Error('No authentication token found. Please login again.');
    }
    return {
      'Authorization': `Bearer ${user.jwt}`,
    };
  };

  // Helper function to handle API errors
  const handleApiError = (response: Response, operation: string) => {
    if (response.status === 401) {
      // Token expired, clear user data
      localStorage.removeItem('blockvault_user');
      setError('Session expired. Please login again.');
      toast.error('Session expired. Please login again.');
      throw new Error('Session expired');
    }
    throw new Error(`${operation} failed: ${response.status} ${response.statusText}`);
  };

  const getAuthHeadersWithContentType = () => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    return {
      'Authorization': `Bearer ${user.jwt}`,
      'Content-Type': 'application/json',
    };
  };

  const uploadFile = async (file: any, passphrase: string, aad?: string, folder?: string) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', passphrase);
      if (aad) formData.append('aad', aad);
      if (folder) formData.append('folder', folder);

      const response = await fetch(`${getApiBase()}/files/`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeaders().Authorization,
        },
        body: formData,
      });

      if (!response.ok) {
        handleApiError(response, 'Upload');
      }

      toast.success('File uploaded successfully');
      await refreshFiles();
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileId: string, passphrase: string, isSharedFile: boolean = false, encryptedKey?: string) => {
    try {
      setLoading(true);
      setError(null);

      let actualPassphrase = passphrase;
      
      // For shared files, decrypt the encrypted key to get the original passphrase
      if (isSharedFile && encryptedKey) {
        try {
          console.log('Decrypting shared file key...', { isSharedFile, hasEncryptedKey: !!encryptedKey });
          const { rsaKeyManager } = await import('../utils/rsa');
          const privateKey = rsaKeyManager.getPrivateKey();
          if (!privateKey) {
            throw new Error('RSA private key not found. Please generate RSA keys first.');
          }
          
          // Decrypt the encrypted key using RSA private key
          const forge = (await import('node-forge')).default;
          const privateKeyObj = forge.pki.privateKeyFromPem(privateKey);
          const encryptedBytes = forge.util.decode64(encryptedKey);
          
          actualPassphrase = privateKeyObj.decrypt(encryptedBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: forge.mgf.mgf1.create(forge.md.sha256.create())
          });
          console.log('Decrypted passphrase length:', actualPassphrase.length);
        } catch (decryptError) {
          console.error('RSA decryption failed:', decryptError);
          throw new Error('Failed to decrypt shared file key. Please ensure you have the correct RSA keys.');
        }
      }

      const response = await fetch(`${getApiBase()}/files/${fileId}?key=${encodeURIComponent(actualPassphrase)}`, {
        method: 'GET',
        headers: getAuthHeadersWithContentType(),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `file_${fileId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('File downloaded successfully');
    } catch (err: any) {
      const errorMessage = err.message || 'Download failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBase()}/files/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeadersWithContentType(),
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast.success('File deleted successfully');
      await refreshFiles();
    } catch (err: any) {
      const errorMessage = err.message || 'Delete failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const shareFile = async (fileId: string, recipientAddress: string, passphrase: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBase()}/files/${fileId}/share`, {
        method: 'POST',
        headers: getAuthHeadersWithContentType(),
        body: JSON.stringify({
          recipient: recipientAddress,
          passphrase,
        }),
      });

      if (!response.ok) {
        throw new Error('Share failed');
      }

      toast.success('File shared successfully');
      await refreshOutgoingShares();
    } catch (err: any) {
      const errorMessage = err.message || 'Share failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${getApiBase()}/files/shares/${shareId}`, {
        method: 'DELETE',
        headers: getAuthHeadersWithContentType(),
      });

      if (!response.ok) {
        throw new Error('Revoke failed');
      }

      toast.success('Share revoked successfully');
      await refreshOutgoingShares();
    } catch (err: any) {
      const errorMessage = err.message || 'Revoke failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshFiles = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/files/`, {
        headers: getAuthHeadersWithContentType(),
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.items || []);
      }
    } catch (err) {
      console.error('Failed to refresh files:', err);
    }
  }, []);

  const refreshSharedFiles = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/files/shared`, {
        headers: getAuthHeadersWithContentType(),
      });

      if (response.ok) {
        const data = await response.json();
        setSharedFiles(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to refresh shared files:', err);
    }
  }, []);

  const refreshOutgoingShares = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/files/shares/outgoing`, {
        headers: getAuthHeadersWithContentType(),
      });

      if (response.ok) {
        const data = await response.json();
        setOutgoingShares(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to refresh outgoing shares:', err);
    }
  }, []);

  // Auto-refresh files when component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    if (user.jwt) {
      refreshFiles();
      refreshSharedFiles();
      refreshOutgoingShares();
    }
  }, [refreshFiles, refreshSharedFiles, refreshOutgoingShares]);

  const value: FileContextType = {
    files,
    sharedFiles,
    outgoingShares,
    loading,
    error,
    uploadFile,
    downloadFile,
    deleteFile,
    shareFile,
    revokeShare,
    refreshFiles,
    refreshSharedFiles,
    refreshOutgoingShares,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
