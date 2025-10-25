import React, { useState } from 'react';
import { Upload, FolderOpen, Share2, Download, Plus, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';
import { FileUpload } from '../components/FileUpload';
import { FileList } from '../components/FileList';
import { ShareModal } from '../components/ShareModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { files, sharedFiles, outgoingShares } = useFiles();
  const [activeTab, setActiveTab] = useState<'my-files' | 'shared' | 'shares'>('my-files');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="text-center p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to BlockVault</h2>
          <p className="text-slate-400 mb-6">
            Connect your wallet and login to start storing your files securely with end-to-end encryption.
          </p>
          <div className="text-sm text-slate-500">
            <p>• End-to-end encryption</p>
            <p>• Web3 authentication</p>
            <p>• Secure file sharing</p>
            <p>• IPFS integration</p>
          </div>
        </Card>
      </div>
    );
  }

  const filteredFiles = (files || []).filter(file =>
    file.name && file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedFiles = (sharedFiles || []).filter(file => {
    const fileName = file.name || file.file_name;
    return fileName && fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredOutgoingShares = (outgoingShares || []).filter(share =>
    share.file_name && share.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Your Secure Vault</h1>
        <p className="text-slate-400">Store and share files with end-to-end encryption</p>
      </div>

      {/* Search and Upload */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button
          onClick={() => setShowUpload(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Upload File
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('my-files')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'my-files'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>My Files ({(files || []).length})</span>
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'shared'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Shared with Me ({(sharedFiles || []).length})</span>
        </button>
        <button
          onClick={() => setActiveTab('shares')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
            activeTab === 'shares'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>My Shares ({(outgoingShares || []).length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'my-files' && (
          <FileList
            files={filteredFiles}
            onShare={(fileId) => {
              setSelectedFile(fileId);
              setShowShareModal(true);
            }}
            type="my-files"
          />
        )}
        {activeTab === 'shared' && (
          <FileList
            files={filteredSharedFiles}
            type="shared"
          />
        )}
        {activeTab === 'shares' && (
          <FileList
            shares={filteredOutgoingShares}
            type="shares"
          />
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && selectedFile && (
        <ShareModal
          fileId={selectedFile}
          onClose={() => {
            setShowShareModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};
