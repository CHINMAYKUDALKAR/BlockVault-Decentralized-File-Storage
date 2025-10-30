import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  MessageSquare,
  ExternalLink,
  XCircle,
  Users as UsersIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { CancelSignatureModal } from './CancelSignatureModal';

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SentSignatureRequest | null>(null);

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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-lg animate-glow-pulse" />
        </div>
        <p className="text-text-secondary font-medium animate-pulse">Loading sent requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="premium" className="text-center py-12 animate-shake">
        <div className="relative mb-6 inline-block">
          <div className="w-16 h-16 bg-gradient-to-br from-status-error/20 to-status-error/40 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
            <AlertTriangle className="w-8 h-8 text-status-error drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 bg-status-error/30 rounded-2xl blur-xl" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">Error Loading Sent Requests</h3>
        <p className="text-text-secondary mb-6">{error}</p>
        <Button onClick={loadSentSignatureRequests} variant="primary">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black text-white font-display mb-2 text-gradient">Sent Signature Requests</h2>
          <p className="text-text-secondary text-base font-medium">Track signature requests you've sent to others</p>
        </div>
        <Button onClick={loadSentSignatureRequests} variant="secondary" size="sm" className="hover:bg-primary-500/10 hover:border-primary-500/50">
          Refresh
        </Button>
      </div>

      {/* Signature Requests List */}
      {signatureRequests.length === 0 ? (
        <Card variant="premium" className="text-center py-20 animate-fade-in-up">
          <div className="relative mb-8 inline-block">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mx-auto animate-float shadow-2xl">
              <FileText className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl blur-2xl opacity-30 animate-glow-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 text-gradient">No Sent Requests</h3>
          <p className="text-text-secondary max-w-md mx-auto text-lg">
            You haven't sent any signature requests yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {signatureRequests.map((request, index) => (
            <Card 
              key={request.id} 
              variant="premium" 
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-7 h-7 text-primary-400" />
                      </div>
                      <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-gradient transition-all">{request.documentName}</h3>
                      <p className="text-sm text-text-secondary font-medium flex items-center space-x-2">
                        <UsersIcon className="w-4 h-4" />
                        <span>Sent to {request.signers.length} signer{request.signers.length !== 1 ? 's' : ''}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {getStatusIcon(request.status)}
                      {request.status === 'pending' && (
                        <div className="absolute inset-0 animate-ping">
                          <Clock className="w-4 h-4 text-yellow-500 opacity-75" />
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(request.status)} backdrop-blur-sm`}>
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

                <div className="flex flex-wrap gap-3">
                  {request.status === 'signed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-status-success/10 to-status-successLight/10 text-status-successLight border-status-success/40 hover:from-status-success/20 hover:to-status-successLight/20"
                      onClick={() => {
                        const downloadUrl = `https://ipfs.io/ipfs/${request.documentId}`;
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = `signed-${request.documentName}`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      leftIcon={<CheckCircle className="w-4 h-4" />}
                    >
                      Download Signed
                    </Button>
                  )}
                  
                  {request.status === 'pending' && isExpired(request.expiresAt) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-status-warning/10 to-status-warningLight/10 text-status-warningLight border-status-warning/40 hover:from-status-warning/20 hover:to-status-warningLight/20"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowCancelModal(true);
                      }}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Cancel & Refund
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Signature Modal */}
      {showCancelModal && selectedRequest && (
        <CancelSignatureModal
          documentHash={selectedRequest.documentId}
          documentName={selectedRequest.documentName}
          deadline={new Date(selectedRequest.expiresAt).getTime()}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={() => {
            setShowCancelModal(false);
            setSelectedRequest(null);
            loadSentSignatureRequests();
          }}
        />
      )}
    </div>
  );
};
