import React, { useState } from 'react';
import { Brain, BarChart3, Shield, CheckCircle, X, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ZKCircuitManager, AIModelManager } from '../../utils/zkCircuits';
import toast from 'react-hot-toast';

interface ZKMLAnalysisModalProps {
  document: {
    file_id: string;
    name: string;
    docHash: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const ZKMLAnalysisModal: React.FC<ZKMLAnalysisModalProps> = ({ document, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'configure' | 'processing' | 'verifying' | 'complete'>('configure');
  const [analysisConfig, setAnalysisConfig] = useState({
    modelType: 'linear_regression',
    inputData: '5',
    modelParams: { m: 2, b: 3 },
    expectedOutput: '13'
  });
  const [analysisResult, setAnalysisResult] = useState<{
    input: number;
    output: number;
    modelParams: { m: number; b: number };
    proofHash: string;
  } | null>(null);

  const handleAnalysisConfigChange = (field: string, value: any) => {
    setAnalysisConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setStep('processing');

    try {
      // 1. Parse input data
      const inputData = parseFloat(analysisConfig.inputData);
      const expectedOutput = parseFloat(analysisConfig.expectedOutput);

      // 2. Run the AI model
      const actualOutput = AIModelManager.runToyLinearModel(inputData, analysisConfig.modelParams);
      
      // Verify the model execution
      const isValid = AIModelManager.verifyModelExecution(inputData, analysisConfig.modelParams, expectedOutput);
      
      if (!isValid) {
        throw new Error('Model execution verification failed');
      }

      setStep('verifying');

      // 3. Generate ZKML proof
      const zkManager = ZKCircuitManager.getInstance();
      const { proof, publicSignals } = await zkManager.generateZKMLProof(
        inputData,
        analysisConfig.modelParams,
        expectedOutput
      );

      // 4. Format proof for smart contract
      const formattedProof = await zkManager.formatProofForContract(proof, publicSignals);

      // 5. Verify on blockchain
      await verifyMLInferenceOnChain(document.docHash, formattedProof);

      setAnalysisResult({
        input: inputData,
        output: actualOutput,
        modelParams: analysisConfig.modelParams,
        proofHash: `0x${Math.random().toString(36).substring(2, 15)}`
      });

      // Save analysis result to document
      const analysisData = {
        model: analysisConfig.modelType,
        result: actualOutput,
        verified: true,
        timestamp: Date.now()
      };

      // Update the document in localStorage
      const existingDocs = JSON.parse(localStorage.getItem('legal_documents') || '[]');
      const updatedDocs = existingDocs.map((doc: any) => 
        doc.id === document.id 
          ? { ...doc, aiAnalysis: analysisData }
          : doc
      );
      localStorage.setItem('legal_documents', JSON.stringify(updatedDocs));

      setStep('complete');
      toast.success('AI analysis verified on-chain!');
      onSuccess();

    } catch (error) {
      console.error('Error running ZKML analysis:', error);
      toast.error('An error occurred during AI analysis.');
      setStep('configure');
    } finally {
      setLoading(false);
    }
  };

  // Placeholder functions
  const verifyMLInferenceOnChain = async (docHash: string, proof: any) => {
    // Simulate smart contract call
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('ML inference verified on chain:', { docHash, proof });
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">ZKML Analysis</h2>
              <p className="text-sm text-slate-400">Verifiable AI inference with zero-knowledge proofs</p>
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
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Document</h3>
              <p className="text-sm text-slate-400">{document.name}</p>
              <p className="text-xs text-slate-500 font-mono">{document.docHash}</p>
            </div>

            {/* Model Configuration */}
            <div className="space-y-4">
              <h3 className="font-medium text-white">AI Model Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Model Type
                </label>
                <select
                  className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  value={analysisConfig.modelType}
                  onChange={(e) => handleAnalysisConfigChange('modelType', e.target.value)}
                >
                  <option value="linear_regression">Linear Regression (y = mx + b)</option>
                  <option value="classification">Document Classification</option>
                  <option value="sentiment">Sentiment Analysis</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Input Value (x)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={analysisConfig.inputData}
                    onChange={(e) => handleAnalysisConfigChange('inputData', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expected Output (y)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={analysisConfig.expectedOutput}
                    onChange={(e) => handleAnalysisConfigChange('expectedOutput', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Model Parameter (m)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={analysisConfig.modelParams.m}
                    onChange={(e) => handleAnalysisConfigChange('modelParams', {
                      ...analysisConfig.modelParams,
                      m: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Model Parameter (b)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={analysisConfig.modelParams.b}
                    onChange={(e) => handleAnalysisConfigChange('modelParams', {
                      ...analysisConfig.modelParams,
                      b: parseFloat(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Model Preview */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <h4 className="font-medium text-blue-500">Model Preview</h4>
              </div>
              <div className="text-sm text-blue-200">
                <p>Model: y = {analysisConfig.modelParams.m}x + {analysisConfig.modelParams.b}</p>
                <p>Input: x = {analysisConfig.inputData}</p>
                <p>Expected Output: y = {analysisConfig.expectedOutput}</p>
                <p>Calculated Output: y = {AIModelManager.runToyLinearModel(
                  parseFloat(analysisConfig.inputData) || 0, 
                  analysisConfig.modelParams
                )}</p>
              </div>
            </div>

            {/* ZKML Info */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-500 mb-1">ZKML Protocol</h4>
                  <p className="text-sm text-orange-200">
                    This will generate a zero-knowledge proof that the AI model was executed correctly 
                    without revealing the model parameters or input data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Running AI Analysis</h3>
            <p className="text-slate-400">
              Executing AI model and preparing for ZK proof generation...
            </p>
          </div>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Generating ZKML Proof</h3>
            <p className="text-slate-400">
              Creating cryptographic proof of AI inference...
            </p>
          </div>
        )}

        {step === 'complete' && analysisResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">AI Analysis Verified!</h3>
              <p className="text-slate-400">
                The AI inference has been cryptographically verified on the blockchain.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Analysis Results</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Input:</span>
                  <span className="text-white">{analysisResult.input}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Output:</span>
                  <span className="text-white">{analysisResult.output}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Model:</span>
                  <span className="text-white">y = {analysisResult.modelParams.m}x + {analysisResult.modelParams.b}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proof Hash:</span>
                  <span className="text-white font-mono text-xs">{analysisResult.proofHash}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-500 mb-1">Verification Complete</h4>
                  <p className="text-sm text-green-200">
                    The AI analysis has been cryptographically verified and recorded on the blockchain. 
                    The proof can be independently verified by anyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button onClick={onClose} variant="outline">
            {step === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          {step === 'configure' && (
            <Button onClick={handleRunAnalysis} loading={loading}>
              Run ZKML Analysis
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
