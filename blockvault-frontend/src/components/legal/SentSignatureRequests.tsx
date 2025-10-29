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

interface SentSignatureRequest {
  id: string;
  documentId: string;
  documentName: string;
  status: 'pending' | 'signed' | 'expired' | 'declined';
  createdAt: string;
  expiresAt: string;
  message: string;
  signers: Array<{
    address: string;
    name: string;
    email: string;
  }>;
  signedBy?: string;
  signedAt?: string;
}

export const SentSignatureRequests: React.FC = () => {
  const { user } = useAuth();
  const [signatureRequests, setSignatureRequests] = useState<SentSignatureRequest[]>([]);
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

  // Load sent signature requests
  const loadSentSignatureRequests = useCallback(async () => {
    setLoading(true);
    try {
      if (!user?.address) {
        setSignatureRequests([]);
        setLoading(false);
        return;
      }

      console.log('📤 Loading sent signature requests for:', user.address);
      
      // First try to get sent requests from the server
      let serverRequests: SentSignatureRequest[] = [];
      try {
        const response = await fetch(`${getApiBase()}/signature-requests-sent?user_address=${encodeURIComponent(user.address)}`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          serverRequests = (data.signatureRequests || []).map((req: any) => ({
            id: req.id,
            documentId: req.documentId || '',
            documentName: req.documentName || 'Untitled Document',
            status: req.status || 'pending',
            createdAt: req.createdAt || new Date().toISOString(),
            expiresAt: req.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            message: req.message || '',
            signers: Array.isArray(req.signers) ? req.signers : [],
            signedBy: req.signedBy,
            signedAt: req.signedAt
          }));
        } else {
          console.warn('Server request failed:', await response.text());
        }
      } catch (err) {
        console.warn('Could not fetch from server:', err);
      }
      
      // Then get local requests as backup
      const allRequests = JSON.parse(localStorage.getItem('blockvault_signature_requests') || '[]');
      console.log('📋 All signature requests in storage:', allRequests.length);
      
      // Filter and format local requests
      const localRequests = allRequests
        .filter((req: any) => req.requestedBy?.toLowerCase() === user.address?.toLowerCase())
        .map((req: any) => ({
          id: req.id,
          documentId: req.documentId || '',
          documentName: req.documentName || 'Untitled Document',
          status: req.status || 'pending',
          createdAt: req.createdAt || new Date().toISOString(),
          expiresAt: req.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          message: req.message || '',
          signers: Array.isArray(req.signers) ? req.signers : [{ 
            address: req.requestedTo,
            name: '',
            email: ''
          }],
          signedBy: req.signedBy,
          signedAt: req.signedAt
        }));
      
      // Merge requests, preferring server data
      const mergedRequests = [...serverRequests];
      for (const localReq of localRequests) {
        if (!mergedRequests.some(r => r.id === localReq.id)) {
          mergedRequests.push(localReq);
        }
      }
      
      console.log(`📤 Found ${mergedRequests.length} signature requests sent by you (${serverRequests.length} from server, ${localRequests.length} local)`);
      
      setSignatureRequests(mergedRequests);
      setError(null);
    } catch (error) {
      console.error('Error loading sent signature requests:', error);
      setError('Failed to load sent signature requests');
    } finally {
      setLoading(false);
    }
  }, [user?.address]);

  // Load sent signature requests on mount and listen for updates
  useEffect(() => {
    loadSentSignatureRequests();
    
    // Listen for signature updates
    const handleSignatureUpdate = () => {
      console.log('🔔 Signature request updated, reloading sent requests...');
      loadSentSignatureRequests();
    };
    
    window.addEventListener('signatureRequestUpdated', handleSignatureUpdate);
    window.addEventListener('storage', handleSignatureUpdate);
    
    // Reload periodically (every 5 seconds)
    const interval = setInterval(loadSentSignatureRequests, 5000);
    
    return () => {
      window.removeEventListener('signatureRequestUpdated', handleSignatureUpdate);
      window.removeEventListener('storage', handleSignatureUpdate);
      clearInterval(interval);
    };
  }, [loadSentSignatureRequests]);

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

  const isExpired = (expiresAt: string) => {
    return Date.now() > new Date(expiresAt).getTime();
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
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Sent Requests</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={loadSentSignatureRequests}>
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
          <h2 className="text-2xl font-bold text-white">Sent Signature Requests</h2>
          <p className="text-slate-400">Signature requests you've sent to others</p>
        </div>
        <Button onClick={loadSentSignatureRequests} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Signature Requests List */}
      {signatureRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Sent Requests</h3>
          <p className="text-slate-400">
            You haven't sent any signature requests yet.
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
                        Sent to {request.signers.length} signer{request.signers.length !== 1 ? 's' : ''}
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
                      <span>Sent {formatDate(request.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Expires {formatDate(request.expiresAt)}
                      </span>
                    </div>
                  </div>

                  {isExpired(request.expiresAt) && request.status === 'pending' && (
                    <div className="flex items-center space-x-2 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>This signature request has expired</span>
                    </div>
                  )}

                  {request.status === 'signed' && (
                    <div className="flex items-center space-x-2 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        Signed by {request.signedBy?.slice(0, 6)}...{request.signedBy?.slice(-4)} on {formatDate(request.signedAt || '')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Signers List */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Signers:</h4>
                  <div className="space-y-2">
                    {request.signers.map((signer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <div>
                          <p className="text-sm text-white">{signer.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400">{signer.address}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {request.signedBy === signer.address ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  {request.status === 'signed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-400 border-green-400 hover:bg-green-400/10"
                      onClick={() => {
                        // Download signed document
                        const downloadUrl = `https://ipfs.io/ipfs/${request.documentId}`;
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `signed-${request.documentName}`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Download Signed Document
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
