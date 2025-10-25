import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
// Removed unused useAuth import
import toast from 'react-hot-toast';

interface CaseDocument {
  id: string;
  name: string;
  hash: string;
  cid: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'signed' | 'executed';
  zkProof?: any;
  signatures?: {
    required: number;
    completed: number;
    signers: Array<{
      address: string;
      signed: boolean;
      signature?: string;
    }>;
  };
}

interface CaseDocumentsListProps {
  caseId: string;
  caseName: string;
  onAddDocument: () => void;
}

export const CaseDocumentsList: React.FC<CaseDocumentsListProps> = ({
  caseId,
  caseName,
  onAddDocument
}) => {
  // Remove unused user variable
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // API Base URL
  const getApiBase = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

  // Auth Headers
  const getAuthHeaders = () => {
    const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
    if (!user.jwt) {
      throw new Error('No authentication token found. Please login again.');
    }
    return {
      'Authorization': `Bearer ${user.jwt}`,
      'Content-Type': 'application/json',
    };
  };

  // Load documents for this case
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/cases/${caseId}/documents`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.status}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  // Load documents on mount and when caseId changes
  useEffect(() => {
    if (caseId) {
      loadDocuments();
    }
  }, [caseId, loadDocuments]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/10 text-green-400';
      case 'signed':
        return 'bg-blue-500/10 text-blue-400';
      case 'executed':
        return 'bg-purple-500/10 text-purple-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'signed':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download document
  const downloadDocument = async (doc: CaseDocument) => {
    try {
      const response = await fetch(`${getApiBase()}/documents/${doc.id}/download`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // View document
  const viewDocument = (doc: CaseDocument) => {
    // Open document in new tab
    window.open(`${getApiBase()}/documents/${doc.id}/view`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Case Documents</h2>
          <p className="text-slate-400">{caseName}</p>
        </div>
        <Button onClick={onAddDocument} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="signed">Signed</option>
            <option value="executed">Executed</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Documents</h3>
          <p className="text-slate-400 mb-4">
            {searchQuery || filterStatus !== 'all' 
              ? 'No documents match your search criteria.'
              : 'This case doesn\'t have any documents yet.'
            }
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Button onClick={onAddDocument} className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-4 h-4 mr-2" />
              Add First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:bg-slate-800/50 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{document.name}</h3>
                      <p className="text-sm text-slate-400">
                        {formatFileSize(document.size)} • {formatDate(document.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(document.status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </div>
                </div>

                {/* Document Details */}
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Hash:</span>
                      <p className="text-white font-mono text-xs">{document.hash.slice(0, 20)}...</p>
                    </div>
                    <div>
                      <span className="text-slate-400">IPFS CID:</span>
                      <p className="text-white font-mono text-xs">{document.cid.slice(0, 20)}...</p>
                    </div>
                  </div>

                  {/* Signatures Progress */}
                  {document.signatures && (
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Signatures</span>
                        <span className="text-sm text-white">
                          {document.signatures.completed}/{document.signatures.required}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(document.signatures.completed / document.signatures.required) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewDocument(document)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadDocument(document)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {document.status === 'verified' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Request Signature
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
