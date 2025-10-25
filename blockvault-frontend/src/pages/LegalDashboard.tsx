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
  Download,
  TrendingUp,
  Grid,
  List,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { NotarizeDocumentModal } from '../components/legal/NotarizeDocumentModal';
import { RedactionModal } from '../components/legal/RedactionModal';
import { RequestSignatureModal } from '../components/legal/RequestSignatureModal';
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
  const [showZKMLModal, setShowZKMLModal] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [showRequestSignatureModal, setShowRequestSignatureModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  BlockVault <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Legal</span>
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-slate-400">ZK-powered legal document management</p>
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
                className="bg-slate-800/50 border-slate-700/50"
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

          {/* Statistics Cards */}
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
      <div className="container mx-auto px-4 py-8">
        {/* Search and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search legal documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="bg-slate-800/50 border-slate-700/50"
            />
          </div>
          <div className="flex items-center space-x-2">
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
            {canPerformAction('canNotarizeDocuments') && (
              <Button
                onClick={() => setShowNotarizeModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Notarize Document
              </Button>
            )}
            {canPerformAction('canCreateCase') && (
              <Button
                variant="outline"
                onClick={() => setShowCreateCaseModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                className="bg-slate-800/50 border-slate-700/50"
              >
                New Case
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
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
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {filteredDocuments.map((document) => (
                    <Card key={document.id} className="hover:bg-slate-800/50 transition-colors">
                      <div className={viewMode === 'list' ? "p-4" : "p-6"}>
                        <div className={`flex items-start justify-between ${viewMode === 'list' ? 'mb-2' : 'mb-4'}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`${viewMode === 'list' ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-500/10 rounded-lg flex items-center justify-center`}>
                              <FileText className={`${viewMode === 'list' ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
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

                        {viewMode === 'grid' && (
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
                        )}

                        <div className={`flex ${viewMode === 'list' ? 'flex-wrap gap-1' : 'flex-wrap gap-2'}`}>
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">AI Analysis Results</h3>
                  <p className="text-sm text-slate-400">
                    Verifiable AI analysis results using ZKML protocols
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {legalDocuments.filter(doc => doc.aiAnalysis).length} analyzed documents
                </div>
              </div>

              {legalDocuments.filter(doc => doc.aiAnalysis).length === 0 ? (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No AI Analysis Results</h3>
                  <p className="text-slate-400">
                    Run AI analysis on your legal documents to see results here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {legalDocuments.filter(doc => doc.aiAnalysis).map((document) => (
                    <Card key={document.id} className="hover:bg-slate-800/50 transition-colors">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                              <Brain className="w-5 h-5 text-purple-500" />
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

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Model:</span>
                            <span className="text-white font-mono text-xs">
                              {document.aiAnalysis?.model || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Result:</span>
                            <span className="text-white font-mono text-xs">
                              {document.aiAnalysis?.result || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Status:</span>
                            <span className={`text-xs ${
                              document.aiAnalysis?.verified ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {document.aiAnalysis?.verified ? 'Verified' : 'Unverified'}
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
            toast.success('Signature request sent successfully!');
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

    </div>
  );
};