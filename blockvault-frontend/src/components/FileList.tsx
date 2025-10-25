import React, { useState } from 'react';
import { 
  File, 
  Download, 
  Share2, 
  Trash2, 
  Calendar, 
  HardDrive,
  User,
  Clock
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface FileListProps {
  files?: any[];
  shares?: any[];
  onShare?: (fileId: string) => void;
  type: 'my-files' | 'shared' | 'shares';
}

export const FileList: React.FC<FileListProps> = ({ 
  files = [], 
  shares = [], 
  onShare, 
  type 
}) => {
  const { downloadFile, deleteFile, revokeShare, loading } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<any>(null);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    try {
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    } catch (error) {
      console.warn('Error formatting file size:', bytes, error);
      return 'Unknown Size';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const handleDownload = (fileId: string, file?: any) => {
    setSelectedFile(fileId);
    setSelectedFileData(file); // Store the file data for later use
    setShowPassphraseModal(true);
  };

  const confirmDownload = async () => {
    if (selectedFile && passphrase) {
      // Check if this is a shared file with encrypted_key
      const isSharedFile = selectedFileData && selectedFileData.encrypted_key;
      const encryptedKey = selectedFileData?.encrypted_key;
      
      // For shared files, use the file_id from the share object, not the share_id
      const actualFileId = isSharedFile ? selectedFileData?.file_id : selectedFile;
      
      await downloadFile(actualFileId, passphrase, isSharedFile, encryptedKey);
      setShowPassphraseModal(false);
      setSelectedFile(null);
      setSelectedFileData(null);
      setPassphrase('');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await deleteFile(fileId);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (window.confirm('Are you sure you want to revoke this share?')) {
      await revokeShare(shareId);
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') return '📁';
    try {
      const normalizedName = fileName.trim().toLowerCase();
      if (normalizedName === '') return '📁';
      
      const parts = normalizedName.split('.');
      if (!parts || parts.length === 0) return '📁';
      
      const ext = parts[parts.length - 1];
      if (!ext || ext === '') return '📁';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return '🖼️';
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) return '🎥';
      if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) return '🎵';
      if (['pdf'].includes(ext)) return '📄';
      if (['txt', 'md', 'doc', 'docx', 'rtf'].includes(ext)) return '📝';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
      return '📁';
    } catch (error) {
      console.warn('Error getting file icon for:', fileName, error);
      return '📁';
    }
  };

  if (type === 'shares') {
    return (
      <div className="space-y-4">
        {(shares || []).length === 0 ? (
          <Card className="text-center py-12">
            <Share2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Shares Yet</h3>
            <p className="text-slate-400">Files you share with others will appear here.</p>
          </Card>
        ) : (
          (shares || []).filter(share => share && typeof share === 'object').map((share) => {
            const shareId = share?.share_id || 'unknown';
            const fileName = share?.file_name || 'Unknown File';
            const sharedWith = share?.shared_with || share?.recipient || 'Unknown';
            const createdAt = share?.created_at || new Date().toISOString();
            
            return (
              <Card key={shareId} className="hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <File className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{fileName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{sharedWith && typeof sharedWith === 'string' ? `${sharedWith.slice(0, 6)}...${sharedWith.slice(-4)}` : 'Unknown'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                <Button
                  onClick={() => handleRevokeShare(shareId)}
                  variant="danger"
                  size="sm"
                  disabled={loading}
                >
                  Revoke
                </Button>
              </div>
            </Card>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {(files || []).length === 0 ? (
        <Card className="text-center py-12">
          <File className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {type === 'my-files' ? 'No Files Yet' : 'No Shared Files'}
          </h3>
          <p className="text-slate-400">
            {type === 'my-files' 
              ? 'Upload your first file to get started.' 
              : 'Files shared with you will appear here.'
            }
          </p>
        </Card>
      ) : (
        (files || []).filter(file => file && typeof file === 'object').map((file) => {
          // Handle both regular files and shared files with null checks
          const fileName = file?.name || file?.file_name || 'Unknown File';
          const fileSize = file?.size || file?.file_size || 0;
          const fileId = file?.file_id || file?.id || 'unknown';
          const createdAt = file?.created_at || new Date().toISOString();
          const folder = file?.folder;
          
          return (
            <Card key={fileId} className="hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{getFileIcon(fileName)}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{fileName}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatFileSize(fileSize)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(createdAt)}</span>
                      </span>
                      {folder && (
                        <span className="text-blue-400">📁 {folder}</span>
                      )}
                    </div>
                  </div>
                </div>
              <div className="flex items-center space-x-2">
                {type === 'my-files' && (
                  <>
                    <Button
                      onClick={() => handleDownload(fileId, file)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Download
                    </Button>
                    {onShare && (
                      <Button
                        onClick={() => onShare(fileId)}
                        variant="outline"
                        size="sm"
                        leftIcon={<Share2 className="w-4 h-4" />}
                      >
                        Share
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(fileId)}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </>
                )}
                {type === 'shared' && (
                  <Button
                    onClick={() => handleDownload(fileId, file)}
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          </Card>
          );
        })
      )}

      {/* Passphrase Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Enter Passphrase</h3>
              <button
                onClick={() => setShowPassphraseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-400 mb-4">
              Enter the passphrase used to encrypt this file.
            </p>
            <input
              type="password"
              placeholder="Enter passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
            />
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowPassphraseModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDownload}
                disabled={!passphrase}
                className="flex-1"
              >
                Download
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
