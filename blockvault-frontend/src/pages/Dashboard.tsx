import React, { useState } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Plus, 
  FolderOpen, 
  Share2, 
  Download, 
  HardDrive,
  TrendingUp,
  Users,
  FileText,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFiles } from '../contexts/FileContext';
import { FileUpload } from '../components/FileUpload';
import { FileList } from '../components/FileList';
import { ShareModal } from '../components/ShareModal';
import { LoginPage } from '../components/LoginPage';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { files, sharedFiles, outgoingShares, refreshSharedFiles, loading } = useFiles();
  const [activeTab, setActiveTab] = useState<'my-files' | 'shared' | 'shares'>('my-files');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos' | 'audio' | 'archives'>('all');
  const [showStats, setShowStats] = useState(true);
  const [refreshingShared, setRefreshingShared] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Calculate statistics
  const totalFiles = (files || []).length;
  const totalSharedFiles = (sharedFiles || []).length;
  const totalShares = (outgoingShares || []).length;
  const totalSize = (files || []).reduce((sum, file) => sum + (file.size || 0), 0);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRefreshSharedFiles = async () => {
    setRefreshingShared(true);
    try {
      await refreshSharedFiles();
    } finally {
      setRefreshingShared(false);
    }
  };

  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) return 'images';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext || '')) return 'videos';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
    if (['pdf', 'txt', 'md', 'doc', 'docx', 'rtf'].includes(ext || '')) return 'documents';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return 'archives';
    return 'other';
  };

  const filteredFiles = (files || []).filter(file => {
    const matchesSearch = file.name && file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || getFileType(file.name || '') === filterType;
    return matchesSearch && matchesFilter;
  });

  const filteredSharedFiles = (sharedFiles || []).filter(file => {
    const fileName = file.name || file.file_name;
    return fileName && fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredOutgoingShares = (outgoingShares || []).filter(share =>
    share.file_name && share.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'date':
        comparison = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const statsCards = [
    {
      title: 'Total Files',
      value: totalFiles,
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(totalSize),
      icon: HardDrive,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Shared Files',
      value: totalSharedFiles,
      icon: Share2,
      color: 'blue',
      change: '+5%'
    },
    {
      title: 'Active Shares',
      value: totalShares,
      icon: Users,
      color: 'orange',
      change: '+3%'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto page-transition">
        <div className="container mx-auto px-4 py-6 pb-24">
          {/* Header Section - Now Scrollable */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                </h1>
                <p className="text-slate-400">Manage your secure files with end-to-end encryption</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowStats(!showStats)}
                  variant="outline"
                  size="sm"
                  leftIcon={showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                >
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </Button>
                 <Button
                   onClick={() => setShowUpload(true)}
                   leftIcon={<Plus className="w-4 h-4" />}
                   className="bg-gradient-to-r from-primary-500 to-accent-400 hover:from-primary-600 hover:to-accent-500"
                 >
                   Upload File
                 </Button>
              </div>
            </div>

            {/* Statistics Cards - Now Scrollable */}
            {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statsCards.map((stat, index) => (
                <Card key={index} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-800/70 transition-all duration-200">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-green-400 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${stat.color}-500/10`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-slate-800/50 border-slate-700/50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="documents">Documents</option>
                <option value="videos">Videos</option>
                <option value="audio">Audio</option>
                <option value="archives">Archives</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  setSortBy(sort as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
              <div className="flex bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

          {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('my-files')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
              activeTab === 'my-files'
                ? 'bg-gradient-to-r from-primary-500 to-accent-400 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>My Files</span>
            <span className="bg-slate-600 text-xs px-2 py-1 rounded-full">{totalFiles}</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
              activeTab === 'shared'
                ? 'bg-gradient-to-r from-primary-500 to-accent-400 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Shared with Me</span>
            <span className="bg-slate-600 text-xs px-2 py-1 rounded-full">{totalSharedFiles}</span>
          </button>
          <button
            onClick={() => setActiveTab('shares')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
              activeTab === 'shares'
                ? 'bg-gradient-to-r from-primary-500 to-accent-400 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>My Shares</span>
            <span className="bg-slate-600 text-xs px-2 py-1 rounded-full">{totalShares}</span>
          </button>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {activeTab === 'my-files' && (
            <FileList
              files={sortedFiles}
              onShare={(fileId) => {
                setSelectedFile(fileId);
                setShowShareModal(true);
              }}
              type="my-files"
              viewMode={viewMode}
            />
          )}
          {activeTab === 'shared' && (
            <div className="space-y-6">
              {/* Shared Files Header with Refresh Button */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-text-primary font-display tracking-tight">Shared with Me</h3>
                  <p className="text-text-secondary text-base font-medium">Files that others have shared with you</p>
                </div>
                <Button
                  onClick={handleRefreshSharedFiles}
                  disabled={refreshingShared}
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingShared ? 'animate-spin' : ''}`} />
                  <span>{refreshingShared ? 'Refreshing...' : 'Refresh'}</span>
                </Button>
              </div>
              
              {/* File List */}
              <FileList
                files={filteredSharedFiles}
                type="shared"
                viewMode={viewMode}
              />
            </div>
          )}
          {activeTab === 'shares' && (
            <FileList
              shares={filteredOutgoingShares}
              type="shares"
              viewMode={viewMode}
            />
          )}
        </div>
      </main>

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

      {/* Footer */}
      <footer className="relative mt-12 border-t border-primary-500/10 bg-slate-900/50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <p className="text-sm text-text-secondary">
              Made with{' '}
              <span className="inline-block animate-pulse text-status-error drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                ❤️
              </span>{' '}
              in India 🇮🇳
            </p>
            <div className="flex items-center space-x-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 bg-status-success rounded-full animate-pulse"></span>
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};