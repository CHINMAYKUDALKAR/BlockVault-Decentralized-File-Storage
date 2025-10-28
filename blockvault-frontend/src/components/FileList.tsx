import React, { useState } from 'react';
import { 
  File, 
  Download, 
  Share2, 
  Trash2, 
  Calendar, 
  User,
  Clock,
  MoreVertical,
  Lock,
  X
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface FileListProps {
  files?: any[];
  shares?: any[];
  onShare?: (fileId: string) => void;
  type: 'my-files' | 'shared' | 'shares';
  viewMode?: 'grid' | 'list';
}

export const FileList: React.FC<FileListProps> = ({ 
  files = [], 
  shares = [], 
  onShare, 
  type,
  viewMode = 'grid'
}) => {
  const { downloadFile, deleteFile, revokeShare } = useFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<any>(null);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

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
    setSelectedFileData(file);
    setShowPassphraseModal(true);
  };

  const confirmDownload = async () => {
    if (selectedFile && passphrase) {
      const isSharedFile = selectedFileData && selectedFileData.encrypted_key;
      const encryptedKey = selectedFileData?.encrypted_key;
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

  const getFileTypeColor = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) return 'from-pink-500 to-rose-500';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext || '')) return 'from-primary-500 to-indigo-500';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext || '')) return 'from-green-500 to-emerald-500';
    if (['pdf', 'txt', 'md', 'doc', 'docx', 'rtf'].includes(ext || '')) return 'from-blue-500 to-cyan-500';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'from-orange-500 to-yellow-500';
    return 'from-secondary-500 to-secondary-600';
  };

  if (type === 'shares') {
    return (
      <div className="space-y-4">
        {(shares || []).length === 0 ? (
          <Card className="text-center py-16 bg-slate-800/30 backdrop-blur-sm border-secondary-700/50">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Shares Yet</h3>
            <p className="text-text-secondary max-w-md mx-auto">Files you share with others will appear here. Start sharing to see your active shares.</p>
          </Card>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(shares || []).filter(share => share && typeof share === 'object').map((share) => {
              const shareId = share?.share_id || 'unknown';
              const fileName = share?.file_name || 'Unknown File';
              const sharedWith = share?.shared_with || share?.recipient || 'Unknown';
              const createdAt = share?.created_at || new Date().toISOString();
              
              return (
                <Card key={shareId} variant="premium" className="group">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getFileTypeColor(fileName)} rounded-lg flex items-center justify-center`}>
                          <span className="text-xl">{getFileIcon(fileName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary truncate">{fileName}</h3>
                          <p className="text-sm text-text-secondary">Shared with</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === shareId ? null : shareId)}
                          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {showActionsMenu === shareId && (
                          <div className="absolute right-0 top-8 bg-secondary-700 rounded-lg shadow-lg border border-secondary-600 py-1 z-10">
                            <button
                              onClick={() => handleRevokeShare(shareId)}
                              className="w-full px-3 py-2 text-left text-red-400 hover:bg-secondary-600 transition-colors text-sm"
                            >
                              Revoke Share
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <User className="w-3 h-3" />
                        <span className="truncate">{sharedWith && typeof sharedWith === 'string' ? `${sharedWith.slice(0, 6)}...${sharedWith.slice(-4)}` : 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(files || []).length === 0 ? (
        <Card className="text-center py-16 bg-slate-800/30 backdrop-blur-sm border-secondary-700/50">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <File className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {type === 'my-files' ? 'No Files Yet' : 'No Shared Files'}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            {type === 'my-files' 
              ? 'Upload your first file to get started with secure, encrypted storage.' 
              : 'Files shared with you will appear here.'
            }
          </p>
        </Card>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {(files || []).filter(file => file && typeof file === 'object').map((file) => {
            const fileName = file?.name || file?.file_name || 'Unknown File';
            const fileSize = file?.size || file?.file_size || 0;
            const fileId = file?.file_id || file?.id || 'unknown';
            const createdAt = file?.created_at || new Date().toISOString();
            const folder = file?.folder;
            
            return (
              <Card key={fileId} className="variant='premium' hover:bg-slate-800/70 transition-all duration-200 group">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getFileTypeColor(fileName)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xl">{getFileIcon(fileName)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate">{fileName}</h3>
                        <p className="text-sm text-text-secondary">{formatFileSize(fileSize)}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === fileId ? null : fileId)}
                        className="p-1 text-text-secondary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showActionsMenu === fileId && (
                        <div className="absolute right-0 top-8 bg-secondary-700 rounded-lg shadow-lg border border-secondary-600 py-1 z-10 min-w-32">
                          <button
                            onClick={() => handleDownload(fileId, file)}
                            className="w-full px-3 py-2 text-left text-text-primary hover:bg-secondary-600 transition-colors text-sm flex items-center space-x-2"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                          {type === 'my-files' && onShare && (
                            <button
                              onClick={() => onShare(fileId)}
                              className="w-full px-3 py-2 text-left text-text-primary hover:bg-secondary-600 transition-colors text-sm flex items-center space-x-2"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                          )}
                          {type === 'my-files' && (
                            <button
                              onClick={() => handleDelete(fileId)}
                              className="w-full px-3 py-2 text-left text-red-400 hover:bg-secondary-600 transition-colors text-sm flex items-center space-x-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(createdAt)}</span>
                    </div>
                    {folder && (
                      <div className="flex items-center space-x-2 text-sm text-blue-400">
                        <span>📁</span>
                        <span>{folder}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-secondary-700/50">
                    <Button
                      onClick={() => handleDownload(fileId, file)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      leftIcon={<Download className="w-3 h-3" />}
                    >
                      Download
                    </Button>
                    {type === 'my-files' && onShare && (
                      <Button
                        onClick={() => onShare(fileId)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        leftIcon={<Share2 className="w-3 h-3" />}
                      >
                        Share
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Passphrase Modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-lg border-secondary-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-400 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Enter Passphrase</h3>
                  <p className="text-sm text-text-secondary">Decrypt and download file</p>
                </div>
              </div>
              <button
                onClick={() => setShowPassphraseModal(false)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-secondary-700/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-text-secondary mb-4">
              Enter the passphrase used to encrypt this file.
            </p>
            <input
              type="password"
              placeholder="Enter passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full px-4 py-3 bg-secondary-700/50 border border-secondary-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              autoFocus
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
                className="flex-1 bg-gradient-to-r from-primary-500 to-accent-400 hover:from-primary-600 hover:to-accent-500"
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