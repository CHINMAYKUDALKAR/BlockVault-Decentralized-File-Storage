import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { contractService } from '../../utils/contractHelpers';

export const ContractPauseBanner: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPauseStatus = async () => {
    try {
      const paused = await contractService.isPaused();
      setIsPaused(paused);
    } catch (error) {
      console.error('Error checking pause status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPauseStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkPauseStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading || !isPaused) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 animate-slide-down">
      <div className="container mx-auto px-4">
        <div className="glass-premium border-2 border-status-warning/50 rounded-2xl p-5 shadow-2xl shadow-status-warning/20 animate-glow-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-status-warning to-status-warningLight rounded-xl flex items-center justify-center shadow-lg animate-bounce-subtle">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-status-warning rounded-xl blur-lg opacity-50 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="text-lg font-bold text-white">⚠️ Smart Contract Paused</h3>
                  <span className="px-3 py-1 bg-status-warning/20 text-status-warningLight text-xs font-bold uppercase tracking-wider rounded-full border border-status-warning/40 animate-pulse">
                    Emergency Mode
                  </span>
                </div>
                <p className="text-sm text-text-secondary font-medium">
                  Document operations are temporarily unavailable. Please check back later or contact support.
                </p>
              </div>
            </div>
            <Button
              onClick={checkPauseStatus}
              variant="outline"
              size="sm"
              className="hover:bg-status-warning/10 hover:border-status-warning/50"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Check Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

