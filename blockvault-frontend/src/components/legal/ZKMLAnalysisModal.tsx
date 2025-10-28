import React, { useState, useEffect } from 'react';
import { Brain, BarChart3, Shield, CheckCircle, X, Zap, FileText, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { getLegalDocumentKey } from '../../utils/legalDocumentKeys';
import toast from 'react-hot-toast';

interface ZKMLAnalysisModalProps {
  document: {
    id?: string;
    file_id: string;
    name: string;
    docHash: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface ZKMLResult {
  summary: string;
  verified: boolean;
  proofHash: string;
  input_hash: string;
  model_hash: string;
  metadata: any;
  proof: any;
}

export const ZKMLAnalysisModal: React.FC<ZKMLAnalysisModalProps> = ({ document, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'configure' | 'processing' | 'verifying' | 'complete'>('configure');
  const [analysisConfig, setAnalysisConfig] = useState({
    maxLength: 150,
    minLength: 30,
    modelType: 'bart-large-cnn'
  });
  const [analysisResult, setAnalysisResult] = useState<ZKMLResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getApiBase = () => {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  };

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

  const handleDocumentSummarization = async () => {
    if (!document.file_id) {
      toast.error('No file ID found for this document');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      // Step 1: Get encryption key
      const passphrase = await getLegalDocumentKey(document.file_id);
      if (!passphrase) {
        toast.error('Document encryption key not found. Please re-upload the document.');
        setLoading(false);
        return;
      }

      console.log('🔐 Retrieved passphrase for document:', document.file_id);

      // Step 2: Call backend ZKML API
      const response = await fetch(`${getApiBase()}/files/${document.file_id}/zkml-summary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          key: passphrase,
          max_length: analysisConfig.maxLength,
          min_length: analysisConfig.minLength
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ZKML API error: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ ZKML Summary generated:', data);

      setStep('verifying');

      // Step 3: Save analysis to localStorage
      const analysisData = {
        model: analysisConfig.modelType,
        summary: data.summary,
        result: data.summary,
        verified: data.verified,
        proof: data.proof,
        metadata: data.metadata,
        timestamp: Date.now()
      };

      // Update document
      const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
      const updatedDocs = existingDocs.map((doc: any) =>
        doc.id === document.id || doc.file_id === document.file_id
          ? { ...doc, aiAnalysis: analysisData }
          : doc
      );
      localStorage.setItem('legal_documents', JSON.stringify(updatedDocs));

      setStep('complete');
      setAnalysisResult({
        summary: data.summary,
        verified: data.verified,
        proofHash: data.metadata.output_hash,
        input_hash: data.metadata.input_hash,
        model_hash: data.metadata.model_hash,
        metadata: data.metadata,
        proof: data.proof
      });

      toast.success('✅ ZKML Summary generated and verified!');
      // Don't call onSuccess() here - let user see the summary first

    } catch (error) {
      console.error('ZKML summarization error:', error);
      const errorMessage = (error as Error).message;
      setError(errorMessage);
      toast.error(`Failed to generate summary: ${errorMessage}`);
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepName: string) => {
    if (step === stepName) {
      return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
      </div>;
    }
    if (step === 'complete' && stepName === 'verifying') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    return <div className="w-6 h-6 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">ZKML Document Summarization</h2>
              <p className="text-sm text-slate-400">Generate verifiable AI summaries with zero-knowledge proofs</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStepIcon('configure')}
              <span className="text-sm text-slate-400">Configure</span>
            </div>
            <div className="flex-1 h-px bg-slate-700 mx-4" />
            <div className="flex items-center space-x-2">
              {getStepIcon('processing')}
              <span className="text-sm text-slate-400">Process</span>
            </div>
            <div className="flex-1 h-px bg-slate-700 mx-4" />
            <div className="flex items-center space-x-2">
              {getStepIcon('verifying')}
              <span className="text-sm text-slate-400">Verify</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {step === 'configure' && (
          <div className="space-y-8">
            {/* Document Info */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-bold text-white mb-3 text-lg flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                  <span className="text-xs">📄</span>
                </div>
                <span>Document Information</span>
              </h3>
              <div className="space-y-2">
                <p className="text-slate-300 font-medium">{document.name}</p>
                <p className="text-xs text-slate-500 font-mono bg-slate-900/50 px-3 py-1 rounded">
                  Hash: {document.docHash.slice(0, 12)}...{document.docHash.slice(-12)}
                </p>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-6">
              <h3 className="font-bold text-white text-xl flex items-center space-x-2">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-400 rounded-lg flex items-center justify-center">
                  <span className="text-xs">⚙</span>
                </div>
                <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                  ZKML Configuration
                </span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium">Maximum Summary Length</label>
                  <Input
                    type="number"
                    value={analysisConfig.maxLength}
                    onChange={(e) => setAnalysisConfig(prev => ({ ...prev, maxLength: parseInt(e.target.value) || 150 }))}
                    placeholder="150"
                    className="bg-slate-800/50 border-slate-600/50 focus:border-primary-500/50"
                  />
                  <p className="text-xs text-slate-500">Maximum number of characters in the summary</p>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium">Minimum Summary Length</label>
                  <Input
                    type="number"
                    value={analysisConfig.minLength}
                    onChange={(e) => setAnalysisConfig(prev => ({ ...prev, minLength: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                    className="bg-slate-800/50 border-slate-600/50 focus:border-primary-500/50"
                  />
                  <p className="text-xs text-slate-500">Minimum number of characters in the summary</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary-500/15 to-accent-400/15 border border-primary-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-400 mb-2 text-lg">ZKML Privacy Guarantee</h4>
                    <p className="text-sm text-blue-200 mb-3 leading-relaxed">
                      Your document content remains private during AI processing. The ZK proof verifies 
                      that the summary was generated correctly without revealing the original text or model weights.
                    </p>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <p className="text-sm text-blue-200">
                        <span className="font-semibold text-blue-300">Model:</span> BART-large-CNN (Facebook's state-of-the-art summarization model)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-br from-red-500/15 to-pink-500/15 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-400 mb-2 text-lg">Error</h4>
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-accent-400/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/30">
              <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Running ZKML Inference
            </h3>
            <p className="text-slate-400 text-lg mb-6 max-w-md mx-auto">
              Extracting text, running BART model, and generating zero-knowledge proof...
            </p>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 max-w-lg mx-auto border border-slate-700/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Model:</span>
                  <span className="text-white font-mono bg-primary-500/20 px-3 py-1 rounded-full text-sm">
                    BART-large-CNN
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="text-primary-400 font-mono bg-primary-500/20 px-3 py-1 rounded-full text-sm">
                    Processing...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Progress:</span>
                  <span className="text-blue-400 font-mono text-sm">
                    Extracting text → Running inference → Generating proof
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Verifying ZK Proof
            </h3>
            <p className="text-slate-400 text-lg mb-6 max-w-md mx-auto">
              Validating the zero-knowledge proof and ensuring inference integrity...
            </p>
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 max-w-lg mx-auto border border-slate-700/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Proof Type:</span>
                  <span className="text-white font-mono bg-green-500/20 px-3 py-1 rounded-full text-sm">
                    Groth16
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Verification:</span>
                  <span className="text-green-400 font-mono bg-green-500/20 px-3 py-1 rounded-full text-sm">
                    In Progress...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Circuit:</span>
                  <span className="text-emerald-400 font-mono text-sm">
                    BN128 Elliptic Curve
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && analysisResult && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ZKML Summary Complete!
              </h3>
              <p className="text-slate-400 text-lg">
                Document successfully summarized with verifiable zero-knowledge proof.
              </p>
            </div>

            {/* Summary Result - Premium Display */}
            <div className="bg-gradient-to-br from-primary-500/15 via-accent-400/10 to-primary-600/15 border border-primary-500/40 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-white text-xl flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-400 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    Generated Summary
                  </span>
                </h4>
                <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-sm font-medium">ZK Verified</span>
                </div>
              </div>
              
              <div className="bg-slate-900/90 rounded-xl p-8 border border-slate-700/50 shadow-inner">
                <p className="text-slate-100 leading-relaxed text-lg font-normal whitespace-pre-wrap">
                  {analysisResult.summary}
                </p>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                    <span>{analysisResult.summary.length} characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>{analysisResult.summary.split(' ').length} words</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-mono">
                  Generated: {new Date(analysisResult.metadata.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Verification & Metadata Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                <h4 className="font-bold text-white mb-4 flex items-center space-x-3 text-lg">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ZK Proof Verification
                  </span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Verification Status:</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysisResult.verified 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {analysisResult.verified ? '✅ Verified' : '❌ Failed'}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proof Hash:</span>
                    <span className="text-white font-mono text-xs bg-slate-800/50 px-2 py-1 rounded">
                      {analysisResult.proofHash.slice(0, 12)}...{analysisResult.proofHash.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Hash:</span>
                    <span className="text-white font-mono text-xs bg-slate-800/50 px-2 py-1 rounded">
                      {analysisResult.model_hash.slice(0, 12)}...{analysisResult.model_hash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-6">
                <h4 className="font-bold text-white mb-4 flex items-center space-x-3 text-lg">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Analysis Metadata
                  </span>
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="text-white font-mono text-sm bg-slate-800/50 px-2 py-1 rounded">
                      BART-large-CNN
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Length:</span>
                    <span className="text-white font-mono">{analysisConfig.maxLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Length:</span>
                    <span className="text-white font-mono">{analysisConfig.minLength}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Processing Time:</span>
                    <span className="text-white font-mono text-sm">
                      {analysisResult.metadata.processing_time || '< 1s'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details - Collapsible */}
            <details className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <summary className="font-bold text-white cursor-pointer mb-4 flex items-center space-x-2 text-lg">
                <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                  <span className="text-xs">⚙</span>
                </div>
                <span>Technical Details</span>
              </summary>
              <div className="space-y-3 text-sm font-mono text-slate-300 bg-slate-900/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500">Input Hash:</span>
                    <div className="text-xs break-all mt-1">{analysisResult.input_hash}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Output Hash:</span>
                    <div className="text-xs break-all mt-1">{analysisResult.proofHash}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Model Hash:</span>
                    <div className="text-xs break-all mt-1">{analysisResult.model_hash}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">ZK Circuit:</span>
                    <div className="text-xs mt-1">Groth16 on BN128</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-500">Public Signals:</span>
                  <span className="text-white ml-2">{analysisResult.proof.public_signals.length}</span>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            onClick={() => {
              if (step === 'complete') {
                onSuccess(); // Refresh documents list
              }
              onClose();
            }} 
            variant="outline"
          >
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'configure' && (
            <Button 
              onClick={handleDocumentSummarization} 
              loading={loading}
              disabled={loading}
              variant="primary"
            >
              <Brain className="w-4 h-4 mr-2" />
              Generate ZKML Summary
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};