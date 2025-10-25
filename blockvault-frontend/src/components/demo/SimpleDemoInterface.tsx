import React, { useState, useEffect } from 'react';
import { demoAutomation, DemoScenario } from '../../utils/demoAutomation';

interface SimpleDemoInterfaceProps {
  onClose?: () => void;
}

const SimpleDemoInterface: React.FC<SimpleDemoInterfaceProps> = ({ onClose }) => {
  const [scenarios, setScenarios] = useState<DemoScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  // const [currentStep, setCurrentStep] = useState(0);
  const [demoLog, setDemoLog] = useState<string[]>([]);

  useEffect(() => {
    const demoScenarios = demoAutomation.getDemoScenarios();
    setScenarios(demoScenarios);
  }, []);

  const runDemo = async (scenarioId: string) => {
    if (isRunning) return;

    setIsRunning(true);
    // setCurrentStep(0);
    setDemoLog([]);

    try {
      // Override console.log to capture demo output
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        setDemoLog(prev => [...prev, message]);
        originalLog(...args);
      };

      await demoAutomation.runDemo(scenarioId);

      // Restore console.log
      console.log = originalLog;
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoLog(prev => [...prev, `❌ Demo failed: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllDemos = async () => {
    if (isRunning) return;

    setIsRunning(true);
    // setCurrentStep(0);
    setDemoLog([]);

    try {
      // Override console.log to capture demo output
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(' ');
        setDemoLog(prev => [...prev, message]);
        originalLog(...args);
      };

      await demoAutomation.runAllDemos();

      // Restore console.log
      console.log = originalLog;
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoLog(prev => [...prev, `❌ Demo failed: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLog = () => {
    setDemoLog([]);
  };

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-slate-900 rounded-xl p-4 w-full max-w-4xl max-h-[98vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">BlockVault Legal Demo</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={runAllDemos}
              disabled={isRunning}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium"
            >
              {isRunning ? '🔄 Running All Demos...' : '🚀 Run All Demos'}
            </button>
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Or Select Specific Demo:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`text-left p-3 rounded-lg transition-colors text-sm ${
                  selectedScenario === scenario.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <div className="font-medium">{scenario.title}</div>
                <div className="text-xs opacity-75 mt-1">
                  {scenario.totalDuration / 1000}s
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Run Selected Demo */}
        {selectedScenario && (
          <div className="mb-4">
            <button
              onClick={() => runDemo(selectedScenario)}
              disabled={isRunning}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {isRunning ? '🔄 Running...' : `▶️ Run ${selectedScenarioData?.title}`}
            </button>
          </div>
        )}

        {/* Demo Output */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Demo Output</h3>
            <button
              onClick={clearLog}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Clear Log
            </button>
          </div>

          <div className="bg-black rounded-lg p-3 h-64 overflow-y-auto">
            <div className="font-mono text-sm text-green-400 space-y-1">
              {demoLog.length === 0 ? (
                <div className="text-gray-500">No demo output yet. Click "Run All Demos" or select a specific demo above.</div>
              ) : (
                demoLog.map((line, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        {isRunning && (
          <div className="bg-blue-900 bg-opacity-50 p-3 rounded-lg mb-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-blue-400">Demo is running...</span>
            </div>
          </div>
        )}

        {/* Features Overview */}
        <div className="bg-slate-800 p-3 rounded-lg">
          <h3 className="text-base font-semibold text-white mb-2">Demo Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">Case Management</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">Document Notarization</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">Verifiable Redaction</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">AI Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">E-Signatures</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-green-400">✅</span>
              <span className="text-gray-300">Audit Trails</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDemoInterface;
