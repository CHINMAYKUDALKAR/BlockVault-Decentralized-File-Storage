import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface SignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  requestedBy: string;
  status: 'pending' | 'signed' | 'expired' | 'declined';
  createdAt: string;
  expiresAt: number;
  message: string;
}

export const SignatureRequests: React.FC = () => {
  const { user } = useAuth();
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load signature requests
  const loadSignatureRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/signature-requests?user_address=${user?.address || ''}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to load signature requests: ${response.status}`);
      }

      const data = await response.json();
      setSignatureRequests(data.signatureRequests);
    } catch (error) {
      console.error('Error loading signature requests:', error);
      setError('Failed to load signature requests');
    } finally {
      setLoading(false);
    }
  }, [user?.address]);

  // Sign a document
  const signDocument = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/documents/${documentId}/sign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          signerAddress: user?.address || '',
          signature: `signature_${Date.now()}`, // Mock signature
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sign document: ${response.status}`);
      }

      await response.json();
      toast.success('Document signed successfully!');
      
      // Update local state immediately
      setSignatureRequests(prev => 
        prev.map(req => 
          req.documentId === documentId 
            ? { ...req, status: 'signed' }
            : req
        )
      );
      
      // Reload signature requests to get latest data
      await loadSignatureRequests();
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document');
    } finally {
      setLoading(false);
    }
  };

  // Decline a signature request
  const declineSignature = async (requestId: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would call a decline endpoint
      toast.success('Signature request declined');
      
      // Remove from local state
      setSignatureRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error declining signature:', error);
      toast.error('Failed to decline signature request');
    } finally {
      setLoading(false);
    }
  };

  // Load signature requests on mount
  useEffect(() => {
    loadSignatureRequests();
  }, [loadSignatureRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'signed':
        return 'bg-green-500/10 text-green-400';
      case 'expired':
        return 'bg-red-500/10 text-red-400';
      case 'declined':
        return 'bg-gray-500/10 text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'signed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'declined':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: number) => {
    return Date.now() > expiresAt;
  };

  if (loading && signatureRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Signature Requests</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={loadSignatureRequests}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Signature Requests</h2>
          <p className="text-slate-400">Documents waiting for your signature</p>
        </div>
        <Button onClick={loadSignatureRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Signature Requests List */}
      {signatureRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Signature Requests</h3>
          <p className="text-slate-400">
            You don't have any pending signature requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {signatureRequests.map((request) => (
            <Card key={request.id} className="hover:bg-slate-800/50 transition-colors">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{request.documentName}</h3>
                      <p className="text-sm text-slate-400">
                        Requested by {request.requestedBy.slice(0, 6)}...{request.requestedBy.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{request.message}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Requested {formatDate(request.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Expires {formatDate(request.expiresAt.toString())}
                      </span>
                    </div>
                  </div>

                  {isExpired(request.expiresAt) && request.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>This signature request has expired</span>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && !isExpired(request.expiresAt) && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => signDocument(request.documentId)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Sign Document
                    </Button>
                    <Button
                      onClick={() => declineSignature(request.id)}
                      variant="outline"
                      disabled={loading}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open document in new tab or download
                        window.open(`/api/documents/${request.documentId}/download`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                  </div>
                )}

                {request.status === 'signed' && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">You have signed this document</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
