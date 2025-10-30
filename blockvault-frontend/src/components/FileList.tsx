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
import { ScrollingText } from './ui/ScrollingText';

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
          <Card variant="premium" className="text-center py-20 animate-fade-in-up">
            <div className="relative mb-8 inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto animate-float shadow-2xl">
                <Share2 className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-2xl opacity-30 animate-glow-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 text-gradient">No Shares Yet</h3>
            <p className="text-text-secondary max-w-md mx-auto text-lg leading-relaxed">
              Files you share with others will appear here. Start sharing to see your active shares.
            </p>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(shares || []).filter(share => share && typeof share === 'object').map((share, index) => {
              const shareId = share?.share_id || 'unknown';
              const fileName = share?.file_name || 'Unknown File';
              const sharedWith = share?.shared_with || share?.recipient || 'Unknown';
              const createdAt = share?.created_at || new Date().toISOString();
              
              return (
                <Card 
                  key={shareId} 
                  variant="premium" 
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`relative w-14 h-14 bg-gradient-to-br ${getFileTypeColor(fileName)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-2xl drop-shadow-sm">{getFileIcon(fileName)}</span>
                          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <ScrollingText
                            text={fileName}
                            className="font-bold text-white mb-1 group-hover:text-gradient transition-all"
                            speed={8}
                          />
                          <p className="text-sm text-text-secondary font-medium">Shared with recipient</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowActionsMenu(showActionsMenu === shareId ? null : shareId)}
                          className="p-2 text-text-secondary hover:text-white hover:bg-secondary-700/50 rounded-lg transition-all group"
                        >
                          <MoreVertical className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                        {showActionsMenu === shareId && (
                          <div className="absolute right-0 top-12 glass-premium rounded-xl shadow-2xl border border-secondary-600/50 py-2 z-10 min-w-[160px] animate-scale-in">
                            <button
                              onClick={() => handleRevokeShare(shareId)}
                              className="w-full px-4 py-2.5 text-left text-status-error hover:bg-status-error/10 transition-colors text-sm font-semibold flex items-center space-x-2"
                            >
                              <X className="w-4 h-4" />
                              <span>Revoke Share</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-secondary-900/30 rounded-xl border border-secondary-700/30">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="w-4 h-4 text-primary-400" />
                        <span className="text-text-primary font-medium">Recipient:</span>
                        <code className="text-primary-400 font-mono text-xs bg-primary-500/5 px-2 py-1 rounded flex-1 truncate">
                          {sharedWith && typeof sharedWith === 'string' ? `${sharedWith.slice(0, 10)}...${sharedWith.slice(-8)}` : 'Unknown'}
                        </code>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-accent-400" />
                        <span className="text-text-secondary font-medium">{formatDate(createdAt)}</span>
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
        <Card variant="premium" className="text-center py-20 animate-fade-in-up">
          <div className="relative mb-8 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto animate-float shadow-2xl">
              <File className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-2xl opacity-30 animate-glow-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 text-gradient">
            {type === 'my-files' ? 'No Files Yet' : 'No Shared Files'}
          </h3>
          <p className="text-text-secondary max-w-md mx-auto text-lg leading-relaxed">
            {type === 'my-files' 
              ? 'Upload your first file to get started with secure, encrypted storage.' 
              : 'Files shared with you will appear here.'
            }
          </p>
        </Card>
      ) : (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {(files || []).filter(file => file && typeof file === 'object').map((file, index) => {
            const fileName = file?.name || file?.file_name || 'Unknown File';
            const fileSize = file?.size || file?.file_size || 0;
            const fileId = file?.file_id || file?.id || 'unknown';
            const createdAt = file?.created_at || new Date().toISOString();
            const folder = file?.folder;
            
            return (
              <Card 
                key={fileId} 
                variant="premium" 
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className={`relative w-14 h-14 bg-gradient-to-br ${getFileTypeColor(fileName)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl drop-shadow-sm">{getFileIcon(fileName)}</span>
                        <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <ScrollingText
                          text={fileName}
                          className="font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors"
                          speed={8}
                        />
                        <p className="text-xs text-text-secondary font-medium">{formatFileSize(fileSize)}</p>
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
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-secondary-700/30">
                    <Button
                      onClick={() => handleDownload(fileId, file)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs hover:bg-primary-500/10 hover:border-primary-500/50"
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Download
                    </Button>
                    {type === 'my-files' && onShare && (
                      <Button
                        onClick={() => onShare(fileId)}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs hover:bg-accent-500/10 hover:border-accent-500/50"
                        leftIcon={<Share2 className="w-3.5 h-3.5" />}
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card 
            variant="premium" 
            className="w-full max-w-md animate-scale-in relative overflow-hidden"
          >
            {/* Decorative background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl blur-lg opacity-40 animate-glow-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Enter Passphrase</h3>
                    <p className="text-sm text-text-secondary font-medium">Decrypt and download file</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPassphraseModal(false)}
                  className="p-2.5 text-text-secondary hover:text-white hover:bg-secondary-700/70 transition-all rounded-xl group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
              
              <p className="text-text-secondary mb-5 leading-relaxed">
                Enter the passphrase used to encrypt this file.
              </p>
              
              <div className="relative mb-6">
                <input
                  type="password"
                  placeholder="Enter passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && passphrase && confirmDownload()}
                  className="w-full px-5 py-4 bg-secondary-800/50 border border-secondary-600/50 rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-medium"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPassphraseModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDownload}
                  disabled={!passphrase}
                  variant="primary"
                  className="flex-1"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};