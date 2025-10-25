import React, { useState } from 'react';
import { Users, Building2, User, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { UserRole } from '../../types/rbac';
import toast from 'react-hot-toast';

interface UserOnboardingProps {
  onComplete: (role: UserRole, firmName?: string) => void;
  userAddress: string;
}

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete, userAddress }) => {
  const [step, setStep] = useState<'role' | 'firm' | 'complete'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [firmName, setFirmName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    
    // If it's a legal professional role, go to firm registration
    if (role === 'lead-attorney' || role === 'associate' || role === 'paralegal') {
      setStep('firm');
    } else {
      // For clients and external counsel, complete immediately
      handleComplete(role);
    }
  };

  const handleComplete = async (role?: UserRole) => {
    const finalRole = role || selectedRole;
    if (!finalRole) return;

    setLoading(true);
    try {
      // Save user role to localStorage
      const userProfile = {
        walletAddress: userAddress,
        role: finalRole,
        firmName: firmName || null,
        onboardedAt: new Date().toISOString(),
        isOnboarded: true
      };

      localStorage.setItem('user_profile', JSON.stringify(userProfile));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('userOnboarded', { 
        detail: { role: finalRole, firmName } 
      }));

      toast.success(`Welcome! You've been registered as a ${getRoleDisplayName(finalRole)}`);
      onComplete(finalRole, firmName);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const displayNames: Record<UserRole, string> = {
      'lead-attorney': 'Lead Attorney',
      associate: 'Associate Attorney',
      paralegal: 'Paralegal',
      client: 'Client',
      'external-counsel': 'External Counsel',
    };
    return displayNames[role];
  };

  const getRoleDescription = (role: UserRole): string => {
    const descriptions: Record<UserRole, string> = {
      'lead-attorney': 'Full access to case management, document operations, and team coordination',
      associate: 'Broad access to document operations and sharing, limited administrative access',
      paralegal: 'Document management and organization, limited operational access',
      client: 'View-only access to documents shared with you, can sign required documents',
      'external-counsel': 'View-only access to documents shared with you, can sign required documents',
    };
    return descriptions[role];
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'lead-attorney':
        return <Shield className="w-8 h-8 text-blue-500" />;
      case 'associate':
        return <Users className="w-8 h-8 text-green-500" />;
      case 'paralegal':
        return <User className="w-8 h-8 text-purple-500" />;
      case 'client':
        return <User className="w-8 h-8 text-orange-500" />;
      case 'external-counsel':
        return <Building2 className="w-8 h-8 text-indigo-500" />;
      default:
        return <User className="w-8 h-8 text-gray-500" />;
    }
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to BlockVault Legal</h1>
              <p className="text-slate-400 text-lg">
                Please select your role to get started with secure legal document management
              </p>
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong>Wallet Address:</strong> <span className="font-mono text-blue-400">{userAddress}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Lead Attorney */}
              <Card 
                className="p-6 cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-transparent hover:border-blue-500/50"
                onClick={() => handleRoleSelection('lead-attorney')}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {getRoleIcon('lead-attorney')}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Lead Attorney</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {getRoleDescription('lead-attorney')}
                  </p>
                  <div className="text-xs text-blue-400">
                    Full administrative access
                  </div>
                </div>
              </Card>

              {/* Associate Attorney */}
              <Card 
                className="p-6 cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-transparent hover:border-green-500/50"
                onClick={() => handleRoleSelection('associate')}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {getRoleIcon('associate')}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Associate Attorney</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {getRoleDescription('associate')}
                  </p>
                  <div className="text-xs text-green-400">
                    Document operations access
                  </div>
                </div>
              </Card>

              {/* Paralegal */}
              <Card 
                className="p-6 cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-transparent hover:border-purple-500/50"
                onClick={() => handleRoleSelection('paralegal')}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {getRoleIcon('paralegal')}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Paralegal</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {getRoleDescription('paralegal')}
                  </p>
                  <div className="text-xs text-purple-400">
                    Document management access
                  </div>
                </div>
              </Card>

              {/* Client */}
              <Card 
                className="p-6 cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-transparent hover:border-orange-500/50"
                onClick={() => handleRoleSelection('client')}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {getRoleIcon('client')}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Client</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {getRoleDescription('client')}
                  </p>
                  <div className="text-xs text-orange-400">
                    View and sign documents
                  </div>
                </div>
              </Card>

              {/* External Counsel */}
              <Card 
                className="p-6 cursor-pointer hover:bg-slate-800/50 transition-colors border-2 border-transparent hover:border-indigo-500/50"
                onClick={() => handleRoleSelection('external-counsel')}
              >
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {getRoleIcon('external-counsel')}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">External Counsel</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {getRoleDescription('external-counsel')}
                  </p>
                  <div className="text-xs text-indigo-400">
                    View and sign documents
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'firm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {selectedRole && getRoleIcon(selectedRole)}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Register Your Law Firm
              </h1>
              <p className="text-slate-400">
                As a {getRoleDisplayName(selectedRole!)}, you need to register your law firm to access case management features.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Law Firm Name *
                </label>
                <Input
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Enter your law firm name"
                  className="w-full"
                />
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-white mb-2">What happens next?</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Your firm will be registered in the system</li>
                  <li>• You'll be able to create and manage case files</li>
                  <li>• You can invite other team members to join your firm</li>
                  <li>• All your documents will be securely encrypted and stored</li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('role')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleComplete()}
                  disabled={!firmName.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Registering...' : 'Register Firm & Continue'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};
