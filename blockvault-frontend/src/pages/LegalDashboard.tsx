import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, 
  Shield, 
  PenTool, 
  Brain, 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Lock, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  TrendingUp,
  Grid,
  List,
  RefreshCw,
  Eye,
  LogOut,
  X,
  ArrowRight,
  UserMinus,
  FileX,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tooltip } from '../components/ui/Tooltip';
import { ScrollingText } from '../components/ui/ScrollingText';
import { NotarizeDocumentModal } from '../components/legal/NotarizeDocumentModal';
import { RedactionModal } from '../components/legal/RedactionModal';
import { RequestSignatureModal } from '../components/legal/RequestSignatureModal';
import { ZKMLAnalysisModal } from '../components/legal/ZKMLAnalysisModal';
import { RevokeAccessModal } from '../components/legal/RevokeAccessModal';
import { RevokeDocumentModal } from '../components/legal/RevokeDocumentModal';
import { ContractPauseBanner } from '../components/legal/ContractPauseBanner';
import { SignatureRequests } from '../components/legal/SignatureRequests';
import { SentSignatureRequests } from '../components/legal/SentSignatureRequests';
import { CreateCaseModal } from '../components/case/CreateCaseModal';
import { CaseProvider } from '../contexts/CaseContext';
import { ApiTester } from '../utils/apiTest';
import { useRBAC } from '../contexts/RBACContext';
import { getRoleDisplayName, getRoleDescription, UserRole } from '../types/rbac';
import { UserOnboarding } from '../components/onboarding/UserOnboarding';
import { WalletConnection } from '../components/auth/WalletConnection';
import { useAuth } from '../contexts/AuthContext';
import { debugUserPermissions } from '../utils/debugPermissions';
import { testAllPermissions } from '../utils/testPermissions';
import { testPermissionMapping } from '../utils/testPermissionMapping';
import { useCase } from '../contexts/CaseContext';
import { useCommonShortcuts } from '../hooks/useKeyboardShortcuts';
import toast from 'react-hot-toast';

interface LegalDocument {
  id: string;
  file_id: string;
  name: string;
  docHash: string;
  cid: string;
  ipfsCid?: string;
  blockchainHash?: string;
  zkProof?: any;
  status: 'registered' | 'awaiting_signatures' | 'executed' | 'revoked';
  timestamp: number;
  owner: string;
  parentHash?: string;
  signatures?: {
    required: number;
    completed: number;
    signers: { address: string; signed: boolean }[];
  };
  transformations?: string[];
  transformationType?: string;
  redactionRules?: any;
  originalDocumentId?: string;
  aiAnalysis?: {
    model: string;
    result: number;
    verified: boolean;
  };
}

const CaseManagementTab: React.FC = () => {
  const { cases, loading, error, getCases } = useCase();
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);

  const handleRefresh = async () => {
    try {
      await getCases();
      toast.success('Cases refreshed successfully');
    } catch (error) {
      console.error('Error refreshing cases:', error);
      toast.error('Failed to refresh cases');
    }
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Cases</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-white font-display mb-2 text-gradient">Case Management</h2>
          <p className="text-text-secondary text-base font-medium">
            Create and manage legal case files with role-based access control
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 glass-premium rounded-xl border border-primary-500/20">
            <span className="text-sm text-text-secondary font-medium">Cases: </span>
            <span className="text-lg font-bold text-primary-400">
              {cases.length}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="hover:bg-primary-500/10 hover:border-primary-500/50"
          >
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateCaseModal(true)}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-xl shadow-primary-500/30"
          >
            New Case
          </Button>
        </div>
      </div>

      {cases.length === 0 ? (
        <Card variant="premium" className="text-center py-20 animate-fade-in-up">
          <div className="relative mb-8 inline-block">
            <div className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl flex items-center justify-center mx-auto animate-float shadow-2xl">
              <Users className="w-14 h-14 text-white drop-shadow-2xl" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-3xl opacity-30 animate-glow-pulse" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-4 text-gradient">No Cases Found</h3>
          <p className="text-text-secondary max-w-lg mx-auto text-lg leading-relaxed mb-8">
            Create your first legal case to get started with case management and role-based access control
          </p>
          <Button
            onClick={() => setShowCreateCaseModal(true)}
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Create First Case
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem, index) => (
            <Card 
              key={caseItem.id} 
              variant="premium" 
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-7 h-7 text-primary-400" />
                      </div>
                      <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg mb-1 group-hover:text-gradient transition-all">{caseItem.title}</h3>
                      <p className="text-sm text-text-secondary font-medium">
                        {new Date(caseItem.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm ${
                      caseItem.status === 'active' ? 'bg-status-success/10 text-status-successLight border border-status-success/30' :
                      caseItem.status === 'closed' ? 'bg-status-error/10 text-status-errorLight border border-status-error/30' :
                      'bg-status-warning/10 text-status-warningLight border border-status-warning/30'
                    }`}>
                      {caseItem.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-5 p-4 bg-secondary-900/30 rounded-xl border border-secondary-700/30">
                  <p className="text-sm text-text-primary line-clamp-2 leading-relaxed">{caseItem.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-medium">Case ID:</span>
                    <code className="text-white font-mono text-xs bg-secondary-800/50 px-2 py-1 rounded">
                      {caseItem.id.slice(0, 10)}...
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary font-medium">Priority:</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      caseItem.priority === 'high' ? 'bg-status-error/15 text-status-errorLight border border-status-error/30' :
                      caseItem.priority === 'medium' ? 'bg-status-warning/15 text-status-warningLight border border-status-warning/30' :
                      'bg-status-success/15 text-status-successLight border border-status-success/30'
                    }`}>
                      {caseItem.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      console.log('View case:', caseItem.id);
                    }}
                    className="flex-1 hover:bg-primary-500/10 hover:border-primary-500/50 hover:text-primary-400"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      console.log('Edit case:', caseItem.id);
                    }}
                    className="flex-1 hover:bg-accent-500/10 hover:border-accent-500/50 hover:text-accent-400"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateCaseModal && (
        <CreateCaseModal
          onClose={() => setShowCreateCaseModal(false)}
          onSuccess={(caseId) => {
            setShowCreateCaseModal(false);
            handleRefresh();
            toast.success('Case created successfully!');
          }}
        />
      )}
    </div>
  );
};

export const LegalDashboard: React.FC = () => {
  const { currentUser, canPerformAction, isOnboarded, completeOnboarding, userProfile, setCurrentUser, logoutFromFirm, changeRole } = useRBAC();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'cases' | 'documents' | 'signatures' | 'sent-signatures' | 'analysis' | 'chain'>('cases');
  const [chainOfCustody, setChainOfCustody] = useState<any[]>([]);
  const [showNotarizeModal, setShowNotarizeModal] = useState(false);
  const [showRedactionModal, setShowRedactionModal] = useState(false);
  const [showZKMLModal, setShowZKMLModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [showRequestSignatureModal, setShowRequestSignatureModal] = useState(false);
  const [showRevokeAccessModal, setShowRevokeAccessModal] = useState(false);
  const [showRevokeDocumentModal, setShowRevokeDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useCommonShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onRefresh: () => refreshDocuments(),
    onNew: () => canPerformAction('canCreateCase') && setShowCreateCaseModal(true),
  });

  // Load legal documents from localStorage only (no mock data)
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>(() => {
    const storedDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
    return storedDocs;
  });


  const filteredDocuments = legalDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const refreshDocuments = useCallback(() => {
    const storedDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
    console.log('📄 Refreshing legal documents:', storedDocs);
    setLegalDocuments(storedDocs);
    buildChainOfCustody(storedDocs);
  }, []);

  // Listen for legal document updates (e.g., after notarization)
  useEffect(() => {
    const handleDocumentUpdate = () => {
      console.log('🔔 Legal documents updated event received, refreshing...');
      refreshDocuments();
    };

    window.addEventListener('legalDocumentsUpdated', handleDocumentUpdate);
    
    return () => {
      window.removeEventListener('legalDocumentsUpdated', handleDocumentUpdate);
    };
  }, [refreshDocuments]);

  const buildChainOfCustody = (documents: LegalDocument[]) => {
    const chain: any[] = [];
    
    // Load existing chain of custody entries from localStorage
    const existingChain = JSON.parse(localStorage.getItem('chain_of_custody') || '[]');
    chain.push(...existingChain);
    
    // Build chain of custody entries from documents
    documents.forEach(doc => {
      // Add document creation/notarization entry
      chain.push({
        id: `create_${doc.id}`,
        documentId: doc.file_id,
        documentName: doc.name,
        action: 'Document Notarized',
        timestamp: doc.timestamp,
        user: doc.owner,
        details: 'Document uploaded, hashed, and registered on blockchain',
        type: 'creation',
        hash: doc.docHash,
        cid: doc.cid,
        status: doc.status
      });

      // Add transformation entries (redactions, etc.)
      if (doc.transformationType === 'redaction') {
        chain.push({
          id: `redact_${doc.id}`,
          documentId: doc.file_id,
          documentName: doc.name,
          action: 'Document Redacted',
          timestamp: doc.timestamp,
          user: doc.owner,
          details: `Document redacted using ZKPT protocol. Rules: ${JSON.stringify(doc.redactionRules)}`,
          type: 'transformation',
          transformationType: 'redaction',
          parentHash: doc.parentHash,
          originalDocumentId: doc.originalDocumentId,
          hash: doc.docHash,
          cid: doc.cid
        });
      }

      // Add signature entries
      if (doc.signatures) {
        doc.signatures.signers.forEach((signer, index) => {
          if (signer.signed) {
            chain.push({
              id: `sign_${doc.id}_${index}`,
              documentId: doc.file_id,
              documentName: doc.name,
              action: 'Document Signed',
              timestamp: doc.timestamp + (index * 1000), // Stagger timestamps
              user: signer.address,
              details: `Document electronically signed by ${signer.address}`,
              type: 'signature',
              hash: doc.docHash
            });
          }
        });
      }

      // Add AI analysis entries
      if (doc.aiAnalysis) {
        chain.push({
          id: `ai_${doc.id}`,
          documentId: doc.file_id,
          documentName: doc.name,
          action: 'AI Analysis Performed',
          timestamp: doc.timestamp + 5000, // After document creation
          user: 'AI System',
          details: `AI analysis performed using ZKML protocol. Model: ${doc.aiAnalysis.model}, Result: ${doc.aiAnalysis.result}`,
          type: 'analysis',
          verified: doc.aiAnalysis.verified,
          hash: doc.docHash
        });
      }
    });

    // Sort by timestamp (most recent first)
    chain.sort((a, b) => b.timestamp - a.timestamp);
    
    setChainOfCustody(chain);
  };

  // Refresh documents when component mounts or when localStorage changes
  useEffect(() => {
    refreshDocuments();
    
    // Listen for storage changes (when documents are added from other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'legal_documents') {
        refreshDocuments();
      }
    };
    
    // Listen for custom events (when documents are added from case management)
    const handleDocumentsUpdated = () => {
      refreshDocuments();
    };

    // Listen for chain of custody updates
    const handleChainOfCustodyUpdated = () => {
      refreshDocuments();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('legalDocumentsUpdated', handleDocumentsUpdated);
    window.addEventListener('chainOfCustodyUpdated', handleChainOfCustodyUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('legalDocumentsUpdated', handleDocumentsUpdated);
      window.removeEventListener('chainOfCustodyUpdated', handleChainOfCustodyUpdated);
    };
  }, [refreshDocuments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'awaiting_signatures':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'executed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'revoked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleDocumentAction = (action: string, document: LegalDocument) => {
    setSelectedDocument(document);
    
    switch (action) {
      case 'redact':
        setShowRedactionModal(true);
        break;
      case 'request-signature':
        setShowRequestSignatureModal(true);
        break;
      case 'analyze':
        setShowZKMLModal(true);
        break;
      case 'view':
        handleViewDocument(document);
        break;
      case 'download':
        handleDownloadDocument(document);
        break;
      case 'revoke-access':
        setShowRevokeAccessModal(true);
        break;
      case 'revoke-document':
        setShowRevokeDocumentModal(true);
        break;
      case 'delete':
        handleDeleteDocument(document);
        break;
      default:
        break;
    }
  };

  const handleViewDocument = async (doc: LegalDocument) => {
    try {
      console.log('📄 Viewing document:', doc);
      
      if (!doc.file_id) {
        toast.error('Document file ID not found. Cannot view document.');
        console.error('Missing file_id in document:', doc);
        return;
      }

      // Get the decryption key from storage
      const { getLegalDocumentKey } = await import('../utils/legalDocumentKeys');
      const decryptionKey = getLegalDocumentKey(doc.file_id);
      
      if (!decryptionKey) {
        toast.error('Decryption key not found. Please ensure you have the correct permissions.');
        console.error('Missing decryption key for file_id:', doc.file_id);
        return;
      }

      console.log('🔑 Decryption key found, fetching document...');

      const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch document from backend with decryption key
      const response = await fetch(`${apiUrl}/files/${doc.file_id}?key=${encodeURIComponent(decryptionKey)}&inline=1`, {
        headers: {
          'Authorization': `Bearer ${user.jwt}`,
        },
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error(`Failed to fetch document: ${response.statusText} - ${errorText}`);
      }

      // Create blob URL and open in new tab
      const blob = await response.blob();
      console.log('📦 Blob created:', blob.type, blob.size, 'bytes');
      
      const blobUrl = URL.createObjectURL(blob);
      console.log('🔗 Blob URL:', blobUrl);
      
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        toast.error('Pop-up blocked! Please allow pop-ups for this site.');
        console.error('Window.open was blocked. Trying fallback...');
        
        // Fallback: Create a link and click it
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.click();
      } else {
        toast.success('Preparing document download...');
      }
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to download document: ${errorMessage}`);
    }
  };

  const handleDownloadDocument = async (doc: LegalDocument) => {
    try {
      console.log('⬇️ Downloading document:', doc);
      
      if (!doc.file_id) {
        toast.error('Document file ID not found. Cannot download document.');
        return;
      }

      // Get the decryption key from storage
      const { getLegalDocumentKey } = await import('../utils/legalDocumentKeys');
      const decryptionKey = getLegalDocumentKey(doc.file_id);
      
      if (!decryptionKey) {
        toast.error('Decryption key not found. Cannot download document.');
        return;
      }

      const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch document from backend with decryption key
      const response = await fetch(`${apiUrl}/files/${doc.file_id}?key=${encodeURIComponent(decryptionKey)}`, {
        headers: {
          'Authorization': `Bearer ${user.jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast.success('Download started...');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async (doc: LegalDocument) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from backend if file_id exists
      if (doc.file_id) {
        const user = JSON.parse(localStorage.getItem('blockvault_user') || '{}');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/files/${doc.file_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.jwt}`,
          },
        });

        if (!response.ok) {
          console.warn('Failed to delete file from backend:', await response.text());
        }
      }

      // Remove from localStorage
      const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
      console.log('🗑️ Deleting document:', { id: doc.id, file_id: doc.file_id });
      console.log('📋 Existing documents before delete:', existingDocs.length);
      
      const updatedDocs = existingDocs.filter((d: any) => {
        // Keep documents that DON'T match (remove the one that matches either id or file_id)
        const shouldKeep = d.id !== doc.id && d.file_id !== doc.file_id;
        if (!shouldKeep) {
          console.log('❌ Removing document:', { id: d.id, file_id: d.file_id, name: d.name });
        }
        return shouldKeep;
      });
      
      console.log('📋 Documents after delete:', updatedDocs.length);
      localStorage.setItem('legal_documents', JSON.stringify(updatedDocs));
      console.log('💾 Updated localStorage with', updatedDocs.length, 'documents');
      
      // Dispatch storage event to trigger refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'legal_documents',
        newValue: JSON.stringify(updatedDocs),
        storageArea: localStorage
      }));

      // Remove encryption key if exists
      try {
        localStorage.removeItem(`file_key_${doc.file_id}`);
        localStorage.removeItem(`blockvault_legal_doc_key_${doc.file_id}`);
      } catch (e) {
        console.log('No encryption key to remove');
      }

      // Immediately update state (before refresh for instant feedback)
      setLegalDocuments(updatedDocs);
      
      // Also refresh to be sure
      refreshDocuments();
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const runDebugTests = async () => {
    try {
      const results = await ApiTester.runAllTests();
      setDebugResults(results);
      toast.success('Debug tests completed');
    } catch (error) {
      console.error('Debug tests failed:', error);
      toast.error('Debug tests failed');
    }
  };

  const runPermissionTests = () => {
    console.log('Running permission tests...');
    testAllPermissions();
    toast.success('Permission tests completed - check console');
  };

  const runPermissionMappingTests = () => {
    console.log('Running permission mapping tests...');
    testPermissionMapping();
    toast.success('Permission mapping tests completed - check console');
  };

  const tabs = [
    { id: 'cases', label: 'Case Management', icon: Users },
    { id: 'documents', label: 'Legal Documents', icon: FileText },
    { id: 'signatures', label: 'Signature Requests', icon: PenTool },
    { id: 'sent-signatures', label: 'Sent Requests', icon: Users },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'chain', label: 'Chain of Custody', icon: Shield }
  ];

  // Check if wallet is connected
  if (!currentUser?.walletAddress) {
    return (
      <WalletConnection
        onConnect={(address) => {
          setCurrentUser({
            walletAddress: address,
            currentRole: undefined,
            currentCaseId: undefined
          });
        }}
      />
    );
  }

  // Check if user needs onboarding
  if (!isOnboarded && currentUser?.walletAddress) {
    return (
      <UserOnboarding
        onComplete={(role, firmName) => {
          completeOnboarding(role, firmName);
          toast.success('Welcome to BlockVault Legal!');
        }}
        userAddress={currentUser.walletAddress}
      />
    );
  }

  // Debug permissions for current user
  if (currentUser?.currentRole) {
    console.log('Current user role:', currentUser.currentRole);
    debugUserPermissions(currentUser.currentRole);
  }

  // Calculate statistics
  const totalDocuments = legalDocuments.length;
  const totalSignatures = legalDocuments.filter(doc => doc.signatures?.completed && doc.signatures.completed > 0).length;
  const totalAnalysis = legalDocuments.filter(doc => doc.aiAnalysis).length;
  const totalChainEntries = chainOfCustody.length;

  const statsCards = [
    {
      title: 'Legal Documents',
      value: totalDocuments,
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Signatures',
      value: totalSignatures,
      icon: PenTool,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'AI Analysis',
      value: totalAnalysis,
      icon: Brain,
      color: 'purple',
      change: '+5%'
    },
    {
      title: 'Chain Entries',
      value: totalChainEntries,
      icon: Shield,
      color: 'orange',
      change: '+3%'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Contract Pause Banner */}
      <ContractPauseBanner />
      
      {/* Top Navigation Bar Only - Sticky */}
      <header className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-40 shadow-lg shadow-black/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-400 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  BlockVault <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Legal</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Debug button - only visible in dev */}
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-slate-500 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Debug Panel</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Current User:', currentUser);
                    console.log('User Profile:', userProfile);
                    console.log('Is Onboarded:', isOnboarded);
                    setDebugResults({
                      currentUser,
                      userProfile,
                      isOnboarded,
                      canCreateCase: canPerformAction('canCreateCase')
                    });
                  }}
                >
                  Log State
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Current User:', currentUser);
                    console.log('Search Query:', searchQuery);
                    console.log('Selected Tab:', selectedTab);
                    setDebugResults({ 
                      currentUser, 
                      searchQuery, 
                      selectedTab,
                      timestamp: new Date().toISOString()
                    });
                  }}
                >
                  Debug Info
                </Button>
              </div>
            </div>
            {debugResults && (
              <div className="bg-slate-900 rounded-lg p-4">
                <pre className="text-sm text-green-400 overflow-auto">
                  {JSON.stringify(debugResults, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto page-transition">
        <div className="container mx-auto px-4 py-6 pb-24">
          
          {/* Role and Firm Badges */}
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {currentUser?.currentRole && (
              <button
                onClick={() => setShowRoleChangeModal(true)}
                className="group flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30 hover:border-primary-500/50 transition-all duration-200"
                title="Click to change role"
              >
                <span className="text-xs font-bold text-primary-300 uppercase tracking-wider">
                  {getRoleDisplayName(currentUser.currentRole)}
                </span>
                <Edit className="w-3 h-3 text-primary-400 group-hover:scale-110 transition-transform" />
              </button>
            )}
            {userProfile?.firmName && (
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-status-success/10 to-status-successLight/10 border border-status-success/30">
                  <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-status-successLight uppercase tracking-wider">
                    {userProfile.firmName}
                  </span>
                </div>
                {/* Leave Firm Button - Always Visible */}
                <Tooltip content="Leave Firm">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to leave ${userProfile.firmName}? You can rejoin anytime by re-onboarding.`)) {
                        logoutFromFirm();
                        toast.success('Successfully left firm');
                      }
                    }}
                    className="p-1.5 rounded-lg text-status-errorLight hover:bg-status-error/10 hover:text-status-error transition-all group"
                  >
                    <LogOut className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Statistics Cards - Responsive Compact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-6 lg:mb-8">
            {statsCards.map((stat, index) => (
              <Card 
                key={index} 
                variant="premium" 
                className="group relative overflow-visible animate-fade-in-up hover:shadow-[0_0_30px_rgba(123,92,244,0.2)] transition-all duration-300 rounded-xl lg:rounded-2xl"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative flex items-center justify-between gap-3 md:gap-4 lg:gap-6 p-3 md:p-4 lg:p-6 min-h-[110px] md:min-h-[130px] lg:min-h-[140px]">
                  <div className="flex-1 min-w-0 z-10">
                    <p className="text-xs md:text-sm font-medium text-text-secondary mb-1.5 md:mb-2 uppercase tracking-wider">{stat.title}</p>
                    <div className="flex items-baseline gap-2 mb-1.5 md:mb-2">
                      <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white group-hover:text-gradient transition-all duration-300">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-[10px] md:text-xs font-semibold text-status-successLight bg-status-success/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-status-success/20">
                        <TrendingUp className="w-3 h-3 mr-1 animate-bounce-subtle" />
                        {stat.change}
                      </div>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0 z-10">
                    <div 
                      className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, rgba(${
                          stat.color === 'blue' ? '99,102,241' :
                          stat.color === 'green' ? '16,185,129' :
                          stat.color === 'purple' ? '168,85,247' :
                          '251,146,60'
                        }, 0.2), rgba(${
                          stat.color === 'blue' ? '99,102,241' :
                          stat.color === 'green' ? '16,185,129' :
                          stat.color === 'purple' ? '168,85,247' :
                          '251,146,60'
                        }, 0.3))`
                      }}
                    >
                      <stat.icon 
                        className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 drop-shadow-lg"
                        style={{
                          color: stat.color === 'blue' ? '#818cf8' :
                                 stat.color === 'green' ? '#6ee7b7' :
                                 stat.color === 'purple' ? '#c084fc' :
                                 '#fdba74'
                        }}
                      />
                    </div>
                    <div 
                      className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"
                      style={{
                        background: stat.color === 'blue' ? 'rgba(99,102,241,0.2)' :
                                   stat.color === 'green' ? 'rgba(16,185,129,0.2)' :
                                   stat.color === 'purple' ? 'rgba(168,85,247,0.2)' :
                                   'rgba(251,146,60,0.2)'
                      }}
                    />
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left pointer-events-none" />
              </Card>
            ))}
          </div>

          {/* Search and Actions - Grouped toolbar */}
        <div className="glass rounded-2xl p-4 mb-8 border border-secondary-700/30">
          <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search legal documents, cases, signatures... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
              variant="premium"
              className="text-base"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Tooltip content="Refresh all data (Ctrl+R)">
              <Button
                variant="secondary"
                size="sm"
                onClick={refreshDocuments}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="hover:bg-primary-500/10 hover:border-primary-500/50"
              >
                Refresh
              </Button>
            </Tooltip>
            <div className="flex glass-premium rounded-xl p-1.5 gap-1">
              <Tooltip content="Grid View">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg' 
                      : 'text-text-secondary hover:text-white hover:bg-secondary-700/50'
                  }`}
                  aria-label="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </Tooltip>
              <Tooltip content="List View">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg' 
                      : 'text-text-secondary hover:text-white hover:bg-secondary-700/50'
                  }`}
                  aria-label="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
            {canPerformAction('canCreateCase') && (
              <Tooltip content="Create new case (Ctrl+N)">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateCaseModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  New Case
                </Button>
              </Tooltip>
            )}
          </div>
          </div>
        </div>

        {/* Tabs - Enhanced with icons visible */}
        <div className="glass-premium rounded-2xl p-1.5 mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`relative flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl transition-all duration-300 font-semibold group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/90 via-primary-600/90 to-accent-500/90 text-white shadow-lg'
                      : 'text-text-secondary hover:text-white hover:bg-secondary-700/40 hover:shadow-[0_0_15px_rgba(123,92,244,0.1)]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-md opacity-25" />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'drop-shadow-lg' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="relative z-10 whitespace-nowrap text-sm">{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {selectedTab === 'cases' && (
            <CaseProvider>
              <CaseManagementTab />
            </CaseProvider>
          )}

          {selectedTab === 'documents' && (
            <div className="space-y-6">
              {/* Upload Button */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white font-display mb-2 text-gradient">Legal Documents</h2>
                  <p className="text-text-secondary text-base font-medium">Notarize, manage, and track your legal documents on blockchain</p>
                </div>
                <Button
                  onClick={() => setShowNotarizeModal(true)}
                  variant="primary"
                  size="lg"
                  leftIcon={<Shield className="w-5 h-5" />}
                  className="shadow-xl shadow-primary-500/30"
                >
                  Notarize Document
                </Button>
              </div>

              {filteredDocuments.length === 0 ? (
                <Card variant="premium" className="text-center py-20 animate-fade-in-up">
                  <div className="relative mb-8 inline-block">
                    <div className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl flex items-center justify-center mx-auto animate-float shadow-2xl">
                      <FileText className="w-14 h-14 text-white drop-shadow-2xl" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-3xl opacity-30 animate-glow-pulse" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 text-gradient">No Legal Documents</h3>
                  <p className="text-text-secondary max-w-lg mx-auto text-lg leading-relaxed mb-8">
                    Notarize documents to create an immutable blockchain record with zero-knowledge proofs
                  </p>
                  <Button
                    onClick={() => setShowNotarizeModal(true)}
                    variant="primary"
                    size="lg"
                    leftIcon={<Shield className="w-5 h-5" />}
                  >
                    Notarize Your First Document
                  </Button>
                </Card>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-5"
                }>
                  {filteredDocuments.map((document, index) => (
                    <Card 
                      key={document.id} 
                      variant="premium" 
                      className="group animate-fade-in-up"
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <div className="p-6 relative min-h-[440px] flex flex-col">

                        {/* Header - Icon, Title, Date + Status inline */}
                        <div className="flex items-start space-x-4 mb-5 overflow-hidden">
                          <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <FileText className="w-7 h-7 text-primary-400" />
                            </div>
                            <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1.5">
                              <ScrollingText
                                text={document.name}
                                className="font-bold text-white text-base group-hover:text-gradient transition-all"
                                speed={8}
                              />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-text-tertiary font-normal">
                                {new Date(document.timestamp).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm whitespace-nowrap ${
                                document.status === 'registered' ? 'bg-status-success/15 text-status-successLight border border-status-success/40' :
                                document.status === 'awaiting_signatures' ? 'bg-status-warning/15 text-status-warningLight border border-status-warning/40' :
                                document.status === 'executed' ? 'bg-status-info/15 text-status-infoLight border border-status-info/40' :
                                'bg-status-error/15 text-status-errorLight border border-status-error/40'
                              }`}>
                                {getStatusIcon(document.status)}
                                <span>{document.status.replace('_', ' ')}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Section - Lighter & Cleaner */}
                        {viewMode === 'grid' && (
                          <div className="mb-6 flex-grow">
                            <div className="space-y-2 p-3 bg-secondary-900/15 rounded-lg border border-secondary-700/15">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-tertiary font-light">Hash:</span>
                                <Tooltip content={document.docHash}>
                                  <code className="text-[10px] text-slate-400 font-mono bg-secondary-900/30 px-1.5 py-0.5 rounded cursor-help hover:text-primary-300 transition-colors">
                                    {document.docHash.slice(0, 10)}...
                                  </code>
                                </Tooltip>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-text-tertiary font-light">IPFS CID:</span>
                                <Tooltip content={document.cid}>
                                  <code className="text-[10px] text-slate-400 font-mono bg-secondary-900/30 px-1.5 py-0.5 rounded truncate max-w-[120px] cursor-help hover:text-accent-300 transition-colors">
                                    {document.cid.slice(0, 10)}...
                                  </code>
                                </Tooltip>
                              </div>
                              {document.parentHash && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-text-tertiary font-light">Parent:</span>
                                  <Tooltip content={document.parentHash}>
                                    <code className="text-[10px] text-slate-400 font-mono bg-secondary-900/30 px-1.5 py-0.5 rounded cursor-help hover:text-accent-300 transition-colors">
                                      {document.parentHash.slice(0, 10)}...
                                    </code>
                                  </Tooltip>
                                </div>
                              )}
                              {document.transformationType && (
                                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-secondary-700/15">
                                  <span className="text-text-tertiary font-light">Type:</span>
                                  <span className="text-[10px] text-accent-300 capitalize font-medium px-1.5 py-0.5 bg-accent-500/5 rounded">
                                    {document.transformationType}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons - Compact 3-Column Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-auto">
                          {/* Row 1 */}
                          <Tooltip content="Download document">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleDocumentAction('download', document)}
                              leftIcon={<Download className="w-3.5 h-3.5" />}
                              className="w-full"
                            >
                              Download
                            </Button>
                          </Tooltip>
                          
                          {canPerformAction('canRequestSignatures') ? (
                            <Tooltip content="Request signatures">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDocumentAction('request-signature', document)}
                                className="w-full hover:bg-accent-500/10 hover:border-accent-500/50"
                                leftIcon={<PenTool className="w-3.5 h-3.5" />}
                              >
                                Signatures
                              </Button>
                            </Tooltip>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="w-full opacity-40"
                              leftIcon={<Lock className="w-3.5 h-3.5" />}
                            >
                              Signatures
                            </Button>
                          )}

                          {canPerformAction('canCreateRedactions') ? (
                            <Tooltip content="Create redaction">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDocumentAction('redact', document)}
                                className="w-full hover:bg-primary-500/10 hover:border-primary-500/50"
                                leftIcon={<Edit className="w-3.5 h-3.5" />}
                              >
                                Redact
                              </Button>
                            </Tooltip>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="w-full opacity-40"
                              leftIcon={<Lock className="w-3.5 h-3.5" />}
                            >
                              Redact
                            </Button>
                          )}

                          {/* Row 2 */}
                          {canPerformAction('canRunZKMLAnalysis') ? (
                            <Tooltip content="AI analysis">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDocumentAction('analyze', document)}
                                className="w-full hover:bg-status-info/10 hover:border-status-info/50"
                                leftIcon={<Brain className="w-3.5 h-3.5" />}
                              >
                                Analyze
                              </Button>
                            </Tooltip>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="w-full opacity-40"
                              leftIcon={<Lock className="w-3.5 h-3.5" />}
                            >
                              Analyze
                            </Button>
                          )}

                          {document.status !== 'revoked' && (
                            <>
                              <Tooltip content="Manage access">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDocumentAction('revoke-access', document)}
                                  className="w-full hover:bg-primary-500/10 hover:border-primary-500/50"
                                  leftIcon={<UserMinus className="w-3.5 h-3.5" />}
                                >
                                  Access
                                </Button>
                              </Tooltip>
                              
                              <Tooltip content="Revoke document">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDocumentAction('revoke-document', document)}
                                  className="w-full text-status-warning hover:bg-status-warning/10 hover:border-status-warning/50"
                                  leftIcon={<FileX className="w-3.5 h-3.5" />}
                                >
                                  Revoke
                                </Button>
                              </Tooltip>
                            </>
                          )}
                          
                          {/* Delete - Full Width */}
                          <Tooltip content="Delete permanently">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentAction('delete', document)}
                              className="col-span-3 text-status-error hover:bg-status-error/10 hover:border-status-error/50 border-status-error/30"
                              leftIcon={<X className="w-3.5 h-3.5" />}
                            >
                              Delete Document
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'signatures' && <SignatureRequests />}
          {selectedTab === 'sent-signatures' && <SentSignatureRequests />}
          {selectedTab === 'analysis' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white font-display mb-2 text-gradient">AI Analysis Results</h2>
                  <p className="text-text-secondary text-base font-medium">
                    Verifiable AI analysis results using zero-knowledge machine learning
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="px-4 py-2 glass-premium rounded-xl border border-primary-500/20">
                    <span className="text-sm text-text-secondary font-medium">Analyzed: </span>
                    <span className="text-lg font-bold text-primary-400">
                      {legalDocuments.filter(doc => doc.aiAnalysis).length}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={refreshDocuments}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    className="hover:bg-primary-500/10 hover:border-primary-500/50"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {legalDocuments.filter(doc => doc.aiAnalysis).length === 0 ? (
                <Card variant="premium" className="text-center py-20 animate-fade-in-up">
                  <div className="relative mb-8 inline-block">
                    <div className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl flex items-center justify-center mx-auto animate-float shadow-2xl">
                      <Brain className="w-14 h-14 text-white drop-shadow-2xl" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-3xl opacity-30 animate-glow-pulse" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 text-gradient">No AI Analysis Results</h3>
                  <p className="text-text-secondary max-w-lg mx-auto text-lg leading-relaxed">
                    Run AI analysis on your legal documents using zero-knowledge machine learning to see results here
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {legalDocuments.filter(doc => doc.aiAnalysis).map((document, index) => (
                    <Card 
                      key={document.id} 
                      variant="premium" 
                      className="group animate-fade-in-up"
                      style={{ animationDelay: `${index * 75}ms` }}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Brain className="w-7 h-7 text-primary-400" />
                              </div>
                              <div className="absolute inset-0 bg-primary-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{document.name}</h3>
                              <p className="text-sm text-slate-400">
                                {new Date(document.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {document.aiAnalysis?.verified ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-slate-400">
                              {document.aiAnalysis?.verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Model:</span>
                            <span className="text-white font-mono text-xs">
                              {document.aiAnalysis?.model || 'Unknown'}
                            </span>
                          </div>
                          
                          {/* Display Summary if available */}
                          {(document.aiAnalysis as any)?.summary && (
                            <div className="mt-3">
                              <span className="text-slate-400 text-sm block mb-2">Summary:</span>
                              <div className="bg-slate-900/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                                <p className="text-slate-200 text-sm leading-relaxed">
                                  {(document.aiAnalysis as any).summary}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Status:</span>
                            <span className={`text-xs ${
                              document.aiAnalysis?.verified ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {document.aiAnalysis?.verified ? '✅ Verified' : '⚠️ Unverified'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentAction('analyze', document)}
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            Re-analyze
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentAction('download', document)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentAction('delete', document)}
                            className="text-red-400 hover:text-red-300 hover:border-red-400"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'chain' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white font-display mb-2 text-gradient">Chain of Custody</h2>
                  <p className="text-text-secondary text-base font-medium">
                    Complete immutable audit trail of all document actions and transformations
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="px-4 py-2 glass-premium rounded-xl border border-primary-500/20">
                    <span className="text-sm text-text-secondary font-medium">Entries: </span>
                    <span className="text-lg font-bold text-primary-400">
                      {chainOfCustody.length}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={refreshDocuments}
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    className="hover:bg-primary-500/10 hover:border-primary-500/50"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {chainOfCustody.length === 0 ? (
                <Card variant="premium" className="text-center py-20 animate-fade-in-up">
                  <div className="relative mb-8 inline-block">
                    <div className="w-28 h-28 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl flex items-center justify-center mx-auto animate-float shadow-2xl">
                      <Shield className="w-14 h-14 text-white drop-shadow-2xl" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl blur-3xl opacity-30 animate-glow-pulse" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 text-gradient">No Chain of Custody Data</h3>
                  <p className="text-text-secondary max-w-lg mx-auto text-lg leading-relaxed">
                    Upload and process documents to see the complete audit trail with immutable blockchain timestamps
                  </p>
                </Card>
              ) : (
                <div className="space-y-5">
                  {chainOfCustody.map((entry, index) => (
                    <Card 
                      key={entry.id} 
                      variant="premium" 
                      className="group animate-fade-in-up relative"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Connection line to next entry */}
                      {index < chainOfCustody.length - 1 && (
                        <div className="absolute left-[47px] -bottom-5 w-0.5 h-5 bg-gradient-to-b from-primary-500/50 to-transparent z-0" />
                      )}
                      
                      <div className="p-6 relative">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                                entry.type === 'creation' ? 'bg-gradient-to-br from-status-success/20 to-status-successLight/20' :
                                entry.type === 'transformation' ? 'bg-gradient-to-br from-primary-500/20 to-accent-500/20' :
                                entry.type === 'signature' ? 'bg-gradient-to-br from-status-info/20 to-status-infoLight/20' :
                                entry.type === 'analysis' ? 'bg-gradient-to-br from-status-warning/20 to-status-warningLight/20' :
                                'bg-gradient-to-br from-secondary-600/20 to-secondary-700/20'
                              }`}>
                                {entry.type === 'creation' && <FileText className="w-7 h-7 text-status-success" />}
                                {entry.type === 'transformation' && <Edit className="w-7 h-7 text-primary-400" />}
                                {entry.type === 'signature' && <PenTool className="w-7 h-7 text-status-info" />}
                                {entry.type === 'analysis' && <Brain className="w-7 h-7 text-status-warning" />}
                              </div>
                              <div className={`absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity ${
                                entry.type === 'creation' ? 'bg-status-success/20' :
                                entry.type === 'transformation' ? 'bg-primary-500/20' :
                                entry.type === 'signature' ? 'bg-status-info/20' :
                                'bg-status-warning/20'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg mb-1 group-hover:text-gradient transition-all">{entry.action}</h4>
                              <p className="text-sm text-text-secondary font-medium">{entry.documentName}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm text-text-primary font-semibold">
                              {new Date(entry.timestamp).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-text-tertiary font-mono">
                              {entry.user}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <p className="text-sm text-text-primary leading-relaxed p-3 bg-secondary-900/30 rounded-lg border border-secondary-700/30">
                            {entry.details}
                          </p>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {entry.hash && (
                              <div className="flex items-center justify-between text-sm p-2 bg-secondary-900/30 rounded-lg">
                                <span className="text-text-secondary font-medium">Document Hash:</span>
                                <code className="text-white font-mono text-xs bg-secondary-800/50 px-2 py-1 rounded">
                                  {entry.hash.slice(0, 16)}...
                                </code>
                              </div>
                            )}

                            {entry.cid && (
                              <div className="flex items-center justify-between text-sm p-2 bg-secondary-900/30 rounded-lg">
                                <span className="text-text-secondary font-medium">IPFS CID:</span>
                                <code className="text-primary-400 font-mono text-xs bg-primary-500/5 px-2 py-1 rounded border border-primary-500/20">
                                  {entry.cid.slice(0, 16)}...
                                </code>
                              </div>
                            )}

                            {entry.parentHash && (
                              <div className="flex items-center justify-between text-sm p-2 bg-secondary-900/30 rounded-lg">
                                <span className="text-text-secondary font-medium">Parent Document:</span>
                                <code className="text-accent-400 font-mono text-xs bg-accent-500/5 px-2 py-1 rounded border border-accent-500/20">
                                  {entry.parentHash.slice(0, 16)}...
                                </code>
                              </div>
                            )}

                            {entry.transformationType && (
                              <div className="flex items-center justify-between text-sm p-2 bg-secondary-900/30 rounded-lg">
                                <span className="text-text-secondary font-medium">Transformation:</span>
                                <span className="text-accent-400 capitalize font-bold px-2 py-1 bg-accent-500/10 rounded">
                                  {entry.transformationType}
                                </span>
                              </div>
                            )}

                            {entry.verified !== undefined && (
                              <div className="flex items-center justify-between text-sm p-2 bg-secondary-900/30 rounded-lg">
                                <span className="text-text-secondary font-medium">Verified:</span>
                                <span className={`font-bold px-2.5 py-1 rounded-full ${
                                  entry.verified 
                                    ? 'bg-status-success/15 text-status-successLight border border-status-success/30' 
                                    : 'bg-status-error/15 text-status-errorLight border border-status-error/30'
                                }`}>
                                  {entry.verified ? '✓ Yes' : '✗ No'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-primary-500/10 bg-slate-900/50 backdrop-blur-lg">
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

      {/* Modals */}

      {showNotarizeModal && (
        <NotarizeDocumentModal
          onClose={() => setShowNotarizeModal(false)}
          onSuccess={() => {
            setShowNotarizeModal(false);
            refreshDocuments();
            // Toast is already shown in the modal
          }}
        />
      )}

      {showRedactionModal && selectedDocument && (
        <RedactionModal
          document={selectedDocument}
          onClose={() => {
            setShowRedactionModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowRedactionModal(false);
            setSelectedDocument(null);
            refreshDocuments(); // Refresh the documents list to show the new redacted document
            // Toast is already shown in the modal
          }}
        />
      )}

      {showRequestSignatureModal && selectedDocument && (
        <RequestSignatureModal
          document={selectedDocument}
          onClose={() => {
            setShowRequestSignatureModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowRequestSignatureModal(false);
            setSelectedDocument(null);
            refreshDocuments();
          }}
        />
      )}

      {showZKMLModal && selectedDocument && (
        <ZKMLAnalysisModal
          document={selectedDocument}
          onClose={() => {
            setShowZKMLModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowZKMLModal(false);
            setSelectedDocument(null);
            refreshDocuments();
            toast.success('AI analysis completed!');
          }}
        />
      )}

      {showRevokeAccessModal && selectedDocument && (
        <RevokeAccessModal
          documentHash={selectedDocument.docHash}
          documentName={selectedDocument.name}
          accessList={[]} // TODO: Fetch actual access list from contract
          onClose={() => {
            setShowRevokeAccessModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowRevokeAccessModal(false);
            setSelectedDocument(null);
            refreshDocuments();
            toast.success('Access revoked successfully!');
          }}
        />
      )}

      {showRevokeDocumentModal && selectedDocument && (
        <RevokeDocumentModal
          documentHash={selectedDocument.docHash}
          documentName={selectedDocument.name}
          documentStatus={selectedDocument.status}
          onClose={() => {
            setShowRevokeDocumentModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowRevokeDocumentModal(false);
            setSelectedDocument(null);
            refreshDocuments();
            toast.success('Document revoked successfully!');
          }}
        />
      )}

      {showCreateCaseModal && (
        <CaseProvider>
          <CreateCaseModal
            onClose={() => setShowCreateCaseModal(false)}
            onSuccess={(caseId) => {
              setShowCreateCaseModal(false);
              toast.success('Case created successfully!');
            }}
          />
        </CaseProvider>
      )}

      {/* Role Change Modal */}
      {showRoleChangeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-[999] p-4 py-24 overflow-y-auto">
          <Card variant="premium" className="w-full max-w-2xl shadow-2xl border-accent-500/30 animate-fade-in-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-600/50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent-400/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary font-display">Change Your Role</h3>
                  <p className="text-sm text-text-secondary">Select a different role to update your permissions</p>
                </div>
              </div>
              <Button
                onClick={() => setShowRoleChangeModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Current Role */}
            <div className="mb-6 p-4 glass rounded-xl border border-accent-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Current Role</p>
                  <p className="text-xl font-bold text-accent-400">{getRoleDisplayName(currentUser?.currentRole || 'client')}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-accent-400" />
              </div>
            </div>

            {/* Role Options */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-semibold text-text-primary mb-4">Available Roles</p>
              {(['lead-attorney', 'associate', 'paralegal', 'client', 'external-counsel'] as UserRole[]).map((role) => {
                const isCurrentRole = currentUser?.currentRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      if (!isCurrentRole) {
                        changeRole(role);
                        setShowRoleChangeModal(false);
                        toast.success(`Role changed to ${getRoleDisplayName(role)}`);
                      }
                    }}
                    disabled={isCurrentRole}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                      isCurrentRole
                        ? 'bg-accent-400/20 border-accent-400/50 cursor-default'
                        : 'glass border-secondary-600/30 hover:border-accent-400/50 hover:bg-accent-400/10 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className={`text-lg font-bold ${isCurrentRole ? 'text-accent-400' : 'text-text-primary'}`}>
                            {getRoleDisplayName(role)}
                          </h4>
                          {isCurrentRole && (
                            <span className="px-3 py-1 bg-accent-400/20 text-accent-400 text-xs font-semibold rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                      {!isCurrentRole && (
                        <ArrowRight className="w-5 h-5 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-secondary-600/50">
              {/* Leave Firm option */}
              {userProfile?.firmName && (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to leave ${userProfile.firmName}? You can rejoin anytime by re-onboarding.`)) {
                      logoutFromFirm();
                      setShowRoleChangeModal(false);
                      toast.success('Successfully left firm');
                    }
                  }}
                  className="flex items-center space-x-2 text-sm text-status-errorLight hover:text-status-error transition-colors group"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>Leave {userProfile.firmName}</span>
                </button>
              )}
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowRoleChangeModal(false)}
                  variant="outline"
                  size="md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};