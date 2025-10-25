import React, { useState } from 'react';
import { X, Users, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { useCase } from '../../contexts/CaseContext';
import { useRBAC } from '../../contexts/RBACContext';
import { CaseFile, PracticeArea, CasePriority, Permission } from '../../types/caseManagement';
import { UserRole, CaseMember, getRoleDisplayName, getRoleDescription } from '../../types/rbac';
import toast from 'react-hot-toast';

interface CreateCaseModalProps {
  onClose: () => void;
  onSuccess: (caseId: string) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ onClose, onSuccess }) => {
  const { createCase } = useCase();
  const { currentUser } = useRBAC();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'basic' | 'team' | 'review'>('basic');
  
  const [formData, setFormData] = useState<Partial<CaseFile>>({
    title: '',
    description: '',
    clientName: '',
    matterNumber: '',
    practiceArea: 'corporate',
    priority: 'medium',
    status: 'active',
    team: [],
    documents: [],
    tasks: [],
    deadlines: [],
    annotations: [],
    accessControl: {
      caseId: '',
      permissions: {},
      roleAssignments: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const [teamMembers, setTeamMembers] = useState<CaseMember[]>([]);
  const [newMember, setNewMember] = useState({
    walletAddress: '',
    name: '',
    email: '',
    role: 'associate' as UserRole
  });

  const practiceAreas: PracticeArea[] = [
    'corporate', 'litigation', 'real-estate', 'family', 'criminal',
    'immigration', 'intellectual-property', 'employment', 'tax', 'other'
  ];

  const priorities: CasePriority[] = ['low', 'medium', 'high', 'urgent'];

  const addTeamMember = () => {
    if (!newMember.walletAddress || !newMember.name) {
      toast.error('Please fill in wallet address and name');
      return;
    }

    // Check if wallet address already exists
    if (teamMembers.some(member => member.walletAddress === newMember.walletAddress)) {
      toast.error('This wallet address is already added to the team');
      return;
    }

    const member: CaseMember = {
      walletAddress: newMember.walletAddress,
      role: newMember.role,
      name: newMember.name,
      email: newMember.email,
      addedAt: new Date(),
      addedBy: currentUser?.walletAddress || 'unknown'
    };

    setTeamMembers(prev => [...prev, member]);
    setNewMember({
      walletAddress: '',
      name: '',
      email: '',
      role: 'associate'
    });
    toast.success('Team member added successfully');
  };

  const removeTeamMember = (walletAddress: string) => {
    setTeamMembers(prev => prev.filter(member => member.walletAddress !== walletAddress));
    toast.success('Team member removed');
  };

  const updateMemberRole = (walletAddress: string, newRole: UserRole) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.walletAddress === walletAddress 
          ? { ...member, role: newRole }
          : member
      )
    );
  };

  const handleInputChange = (field: keyof CaseFile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSubmit = async () => {
    if (!formData.title || !formData.clientName || !formData.matterNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Add current user as lead attorney if not already in team
      const currentUserMember: CaseMember = {
        walletAddress: currentUser?.walletAddress || 'unknown',
        role: 'lead-attorney',
        name: currentUser?.walletAddress || 'Current User',
        email: '',
        addedAt: new Date(),
        addedBy: currentUser?.walletAddress || 'unknown'
      };

      const allTeamMembers = [currentUserMember, ...teamMembers];

      const caseData = {
        ...formData,
        team: allTeamMembers.map(member => ({
          walletAddress: member.walletAddress,
          name: member.name,
          role: member.role,
          email: member.email || '',
          addedAt: member.addedAt,
          addedBy: member.addedBy,
          permissions: getPermissionsForRole(member.role)
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newCase = await createCase(caseData);
      toast.success('Case created successfully');
      onSuccess(newCase.id);
      onClose();
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsForRole = (role: string): Permission[] => {
    switch (role) {
      case 'lead-attorney':
        return ['view', 'comment', 'edit', 'delete', 'share', 'manage-team'];
      case 'associate':
        return ['view', 'comment', 'edit', 'share'];
      case 'paralegal':
        return ['view', 'comment'];
      case 'client':
        return ['view'];
      case 'external-counsel':
        return ['view', 'comment'];
      default:
        return ['view'];
    }
  };

  const getStepIcon = (stepName: string) => {
    if (step === stepName) {
      return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
      </div>;
    }
    return <div className="w-6 h-6 bg-slate-700 rounded-full" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Create New Case</h2>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStepIcon('basic')}
                <span className={`text-sm ${step === 'basic' ? 'text-blue-400' : 'text-slate-400'}`}>
                  Basic Info
                </span>
              </div>
              <div className="w-8 h-px bg-slate-700" />
              <div className="flex items-center space-x-2">
                {getStepIcon('team')}
                <span className={`text-sm ${step === 'team' ? 'text-blue-400' : 'text-slate-400'}`}>
                  Team
                </span>
              </div>
              <div className="w-8 h-px bg-slate-700" />
              <div className="flex items-center space-x-2">
                {getStepIcon('review')}
                <span className={`text-sm ${step === 'review' ? 'text-blue-400' : 'text-slate-400'}`}>
                  Review
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme Corp Merger"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName || ''}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Matter Number *
                  </label>
                  <input
                    type="text"
                    value={formData.matterNumber || ''}
                    onChange={(e) => handleInputChange('matterNumber', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Practice Area
                  </label>
                  <select
                    value={formData.practiceArea || 'corporate'}
                    onChange={(e) => handleInputChange('practiceArea', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {practiceAreas.map(area => (
                      <option key={area} value={area}>
                        {area.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the case..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Team Members */}
          {step === 'team' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">Team Members</h3>
                  <p className="text-sm text-slate-400">
                    Add team members with specific roles and permissions
                  </p>
                </div>
              </div>

              {/* Add New Member Form */}
              <Card className="p-6">
                <h4 className="font-medium text-white mb-4">Add Team Member</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Wallet Address *
                    </label>
                    <Input
                      value={newMember.walletAddress}
                      onChange={(e) => setNewMember(prev => ({ ...prev, walletAddress: e.target.value }))}
                      placeholder="0x..."
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Name *
                    </label>
                    <Input
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Role *
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="associate">Associate Attorney</option>
                      <option value="paralegal">Paralegal</option>
                      <option value="client">Client</option>
                      <option value="external-counsel">External Counsel</option>
                    </select>
                  </div>
                </div>
                <Button onClick={addTeamMember} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </Card>

              {/* Team Members List */}
              <div className="space-y-4">
                <h4 className="font-medium text-white">Current Team Members</h4>
                {teamMembers.map((member, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h5 className="font-medium text-white">{member.name}</h5>
                        <p className="text-sm text-slate-400 font-mono">{member.walletAddress}</p>
                        {member.email && (
                          <p className="text-sm text-slate-400">{member.email}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.walletAddress)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-slate-400">Role: </span>
                        <span className="text-sm font-medium text-blue-400">
                          {getRoleDisplayName(member.role)}
                        </span>
                      </div>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.walletAddress, e.target.value as UserRole)}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="associate">Associate Attorney</option>
                        <option value="paralegal">Paralegal</option>
                        <option value="client">Client</option>
                        <option value="external-counsel">External Counsel</option>
                      </select>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-xs text-slate-500">
                        {getRoleDescription(member.role)}
                      </p>
                    </div>
                  </Card>
                ))}
                
                {teamMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-400">No team members added yet</p>
                    <p className="text-sm text-slate-500">Add team members to collaborate on this case</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Case Summary</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-400">Title</label>
                      <p className="text-white">{formData.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Client</label>
                      <p className="text-white">{formData.clientName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Matter Number</label>
                      <p className="text-white">{formData.matterNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Practice Area</label>
                      <p className="text-white">{formData.practiceArea}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Priority</label>
                      <p className="text-white">{formData.priority}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Status</label>
                      <p className="text-white">{formData.status}</p>
                    </div>
                  </div>
                  
                  {formData.description && (
                    <div>
                      <label className="text-sm font-medium text-slate-400">Description</label>
                      <p className="text-white">{formData.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-slate-400">Team Members</label>
                    <p className="text-white">{teamMembers.length} members</p>
                    {teamMembers.map((member, index) => (
                      <div key={index} className="text-sm text-slate-300 ml-4">
                        {member.name} ({member.role}) - {member.walletAddress.slice(0, 10)}...
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-400 mb-1">Legal Notice</h4>
                    <p className="text-sm text-amber-200">
                      Creating a case will establish role-based access control on the blockchain. 
                      All team members will be granted appropriate permissions based on their assigned roles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <div>
              {step !== 'basic' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (step === 'team') setStep('basic');
                    if (step === 'review') setStep('team');
                  }}
                >
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {step !== 'review' ? (
                <Button
                  onClick={() => {
                    if (step === 'basic') setStep('team');
                    if (step === 'team') setStep('review');
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Creating...' : 'Create Case'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
