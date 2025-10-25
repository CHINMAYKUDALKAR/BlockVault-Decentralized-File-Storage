import React, { useState, useEffect, useCallback } from 'react';
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
  Download
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { NotarizeDocumentModal } from '../components/legal/NotarizeDocumentModal';
import { RedactionModal } from '../components/legal/RedactionModal';
import { ESignatureModal } from '../components/legal/ESignatureModal';
import { ZKMLAnalysisModal } from '../components/legal/ZKMLAnalysisModal';
import { SignatureRequests } from '../components/legal/SignatureRequests';
import { SentSignatureRequests } from '../components/legal/SentSignatureRequests';
import { CreateCaseModal } from '../components/case/CreateCaseModal';
import { CaseProvider } from '../contexts/CaseContext';
import { ApiTester } from '../utils/apiTest';
import DemoLauncher from '../components/demo/DemoLauncher';
import { useRBAC } from '../contexts/RBACContext';
import { getRoleDisplayName } from '../types/rbac';
import { UserOnboarding } from '../components/onboarding/UserOnboarding';
import { WalletConnection } from '../components/auth/WalletConnection';
import { debugUserPermissions } from '../utils/debugPermissions';
import { testAllPermissions } from '../utils/testPermissions';
import { testPermissionMapping } from '../utils/testPermissionMapping';
import toast from 'react-hot-toast';

interface LegalDocument {
  id: string;
  file_id: string;
  name: string;
  docHash: string;
  cid: string;
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

export const LegalDashboard: React.FC = () => {
  const { currentUser, canPerformAction, isOnboarded, completeOnboarding, userProfile, setCurrentUser } = useRBAC();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'cases' | 'documents' | 'signatures' | 'sent-signatures' | 'analysis' | 'chain'>('cases');
  const [chainOfCustody, setChainOfCustody] = useState<any[]>([]);
  const [showNotarizeModal, setShowNotarizeModal] = useState(false);
  const [showRedactionModal, setShowRedactionModal] = useState(false);
  const [showESignatureModal, setShowESignatureModal] = useState(false);
  const [showZKMLModal, setShowZKMLModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [showRequestSignatureModal, setShowRequestSignatureModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

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
    setLegalDocuments(storedDocs);
    buildChainOfCustody(storedDocs);
  }, []);

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
      case 'sign':
        setShowESignatureModal(true);
        break;
      case 'request-signature':
        setShowRequestSignatureModal(true);
        break;
      case 'analyze':
        setShowZKMLModal(true);
        break;
      default:
        break;
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">BlockVault Legal</h1>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-slate-400">ZK-powered legal document management</p>
          {currentUser?.currentRole && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-sm text-blue-400 font-medium">
                {getRoleDisplayName(currentUser.currentRole)}
              </span>
            </>
          )}
          {userProfile?.firmName && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-sm text-green-400 font-medium">
                {userProfile.firmName}
              </span>
            </>
          )}
        </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <DemoLauncher />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                Debug
              </Button>
              {currentUser?.currentRole && (
                <div className="text-sm text-slate-400">
                  Can Create Case: {canPerformAction('canCreateCase') ? '✅' : '❌'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                  onClick={runDebugTests}
                >
                  API Tests
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={runPermissionTests}
                >
                  Permission Tests
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={runPermissionMappingTests}
                >
                  Mapping Tests
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            {canPerformAction('canNotarizeDocuments') && (
              <Button
                onClick={() => setShowNotarizeModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Notarize Document</span>
              </Button>
            )}
            {canPerformAction('canCreateCase') && (
              <Button
                variant="outline"
                onClick={() => setShowCreateCaseModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Case</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {selectedTab === 'cases' && (
            <CaseProvider>
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Case Management</h3>
                  <p className="text-slate-400">
                    Create and manage legal case files with role-based access control
                  </p>
                </div>
              </div>
            </CaseProvider>
          )}

          {selectedTab === 'documents' && (
            <div className="space-y-6">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Legal Documents</h3>
                  <p className="text-slate-400">
                    Upload and notarize documents to get started with legal document management
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:bg-slate-800/50 transition-colors">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{document.name}</h3>
                              <p className="text-sm text-slate-400">
                                {new Date(document.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(document.status)}
                            <span className="text-xs text-slate-400 capitalize">
                              {document.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Hash:</span>
                            <span className="text-white font-mono text-xs">
                              {document.docHash.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">IPFS CID:</span>
                            <span className="text-white font-mono text-xs">
                              {document.cid.slice(0, 8)}...
                            </span>
                          </div>
                          {document.parentHash && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Parent Document:</span>
                              <span className="text-blue-400 font-mono text-xs">
                                {document.parentHash.slice(0, 8)}...
                              </span>
                            </div>
                          )}
                          {document.transformationType && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Transformation:</span>
                              <span className="text-purple-400 capitalize">
                                {document.transformationType}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canPerformAction('canCreateRedactions') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentAction('redact', document)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Redact
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              title={`${getRoleDisplayName(currentUser?.currentRole || 'client')} role cannot create redactions`}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Redact
                            </Button>
                          )}

                          {canPerformAction('canSignDocuments') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentAction('sign', document)}
                            >
                              <PenTool className="w-3 h-3 mr-1" />
                              Sign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              title={`${getRoleDisplayName(currentUser?.currentRole || 'client')} role cannot sign documents`}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Sign
                            </Button>
                          )}

                          {canPerformAction('canRequestSignatures') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentAction('request-signature', document)}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Request
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              title={`${getRoleDisplayName(currentUser?.currentRole || 'client')} role cannot request signatures`}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Request
                            </Button>
                          )}

                          {canPerformAction('canRunZKMLAnalysis') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentAction('analyze', document)}
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              Analyze
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              title={`${getRoleDisplayName(currentUser?.currentRole || 'client')} role cannot run AI analysis`}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Analyze
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/documents/${document.file_id}/download`, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
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
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Analysis</h3>
              <p className="text-slate-400">
                Run verifiable AI analysis on your legal documents using ZKML protocols
              </p>
            </div>
          )}

          {selectedTab === 'chain' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Chain of Custody</h3>
                  <p className="text-sm text-slate-400">
                    Complete audit trail of all document actions and transformations
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {chainOfCustody.length} entries
                </div>
              </div>

              {chainOfCustody.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Chain of Custody Data</h3>
                  <p className="text-slate-400">
                    Upload and process documents to see the complete audit trail
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chainOfCustody.map((entry, index) => (
                    <Card key={entry.id} className="hover:bg-slate-800/50 transition-colors">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              entry.type === 'creation' ? 'bg-green-500/10' :
                              entry.type === 'transformation' ? 'bg-purple-500/10' :
                              entry.type === 'signature' ? 'bg-blue-500/10' :
                              entry.type === 'analysis' ? 'bg-orange-500/10' :
                              'bg-slate-500/10'
                            }`}>
                              {entry.type === 'creation' && <FileText className="w-5 h-5 text-green-500" />}
                              {entry.type === 'transformation' && <Edit className="w-5 h-5 text-purple-500" />}
                              {entry.type === 'signature' && <PenTool className="w-5 h-5 text-blue-500" />}
                              {entry.type === 'analysis' && <Brain className="w-5 h-5 text-orange-500" />}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{entry.action}</h4>
                              <p className="text-sm text-slate-400">{entry.documentName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-400">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {entry.user}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-slate-300">{entry.details}</p>
                          
                          {entry.hash && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Document Hash:</span>
                              <span className="text-white font-mono text-xs">
                                {entry.hash.slice(0, 16)}...
                              </span>
                            </div>
                          )}

                          {entry.cid && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">IPFS CID:</span>
                              <span className="text-white font-mono text-xs">
                                {entry.cid.slice(0, 16)}...
                              </span>
                            </div>
                          )}

                          {entry.parentHash && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Parent Document:</span>
                              <span className="text-blue-400 font-mono text-xs">
                                {entry.parentHash.slice(0, 16)}...
                              </span>
                            </div>
                          )}

                          {entry.transformationType && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Transformation:</span>
                              <span className="text-purple-400 capitalize">
                                {entry.transformationType}
                              </span>
                            </div>
                          )}

                          {entry.verified !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Verified:</span>
                              <span className={`${entry.verified ? 'text-green-400' : 'text-red-400'}`}>
                                {entry.verified ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Chain connection line */}
                        {index < chainOfCustody.length - 1 && (
                          <div className="flex justify-center">
                            <div className="w-px h-4 bg-slate-600"></div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNotarizeModal && (
        <NotarizeDocumentModal
          onClose={() => setShowNotarizeModal(false)}
          onSuccess={() => {
            setShowNotarizeModal(false);
            refreshDocuments();
            toast.success('Document notarized successfully!');
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
            toast.success('Verifiable redaction created!');
          }}
        />
      )}

      {showESignatureModal && selectedDocument && (
        <ESignatureModal
          document={selectedDocument}
          onClose={() => {
            setShowESignatureModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowESignatureModal(false);
            setSelectedDocument(null);
            refreshDocuments();
            toast.success('Document signed successfully!');
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

      {showRequestSignatureModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Request Signature</h3>
            <p className="text-slate-400 mb-4">
              Request signature functionality will be implemented here.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestSignatureModal(false);
                  setSelectedDocument(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowRequestSignatureModal(false);
                  setSelectedDocument(null);
                  toast.success('Signature request sent!');
                }}
                className="flex-1"
              >
                Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};