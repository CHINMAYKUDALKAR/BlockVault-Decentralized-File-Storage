import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Eye,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useCase } from '../../contexts/CaseContext';
import { CaseDocumentUploadModal } from './CaseDocumentUploadModal';
import { CaseDocumentsList } from './CaseDocumentsList';
// import { CaseFile } from '../../types/caseManagement';

interface CaseDashboardProps {
  caseId?: string;
  onCaseSelect?: (caseId: string) => void;
}

export const CaseDashboard: React.FC<CaseDashboardProps> = ({ 
  caseId, 
  onCaseSelect 
}) => {
  const { 
    cases, 
    dashboard, 
    loading, 
    error,
    getCases,
    loadCurrentCase
  } = useCase();

  const [selectedCase, setSelectedCase] = useState<string | null>(caseId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  // Load cases on mount
  useEffect(() => {
    getCases().catch(console.error);
  }, [getCases]);

  // Load dashboard when case is selected
  useEffect(() => {
    if (selectedCase) {
      loadCurrentCase(selectedCase).catch(console.error);
    }
  }, [selectedCase, loadCurrentCase]);

  const handleCaseSelect = async (caseId: string) => {
    setSelectedCase(caseId);
    if (onCaseSelect) {
      onCaseSelect(caseId);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.matterNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-400';
      case 'on-hold': return 'bg-yellow-500/10 text-yellow-400';
      case 'closed': return 'bg-gray-500/10 text-gray-400';
      case 'archived': return 'bg-purple-500/10 text-purple-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-400';
      case 'high': return 'bg-orange-500/10 text-orange-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400';
      case 'low': return 'bg-green-500/10 text-green-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  if (loading && !cases.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Cases</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={() => getCases()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Management</h1>
          <p className="text-slate-400">Manage your legal cases and documents</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases, clients, or matter numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Cases ({filteredCases.length})</h2>
              <div className="text-sm text-slate-400">
                {cases.length} total cases
              </div>
            </div>
            
            <div className="space-y-3">
              {filteredCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCaseSelect(caseItem.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-slate-800/50 ${
                    selectedCase === caseItem.id 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-white mb-1">{caseItem.title}</h3>
                      <p className="text-sm text-slate-400 mb-2">{caseItem.clientName}</p>
                      <p className="text-xs text-slate-500">Matter: {caseItem.matterNumber}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{caseItem.practiceArea}</span>
                    <span>Updated {new Date(caseItem.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {filteredCases.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Cases Found</h3>
                  <p className="text-slate-400 mb-4">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first case to get started'
                    }
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Case
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Case Overview */}
        <div className="space-y-6">
          {selectedCase && dashboard ? (
            <>
              {/* Case Overview Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Case Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-400">Documents</span>
                    </div>
                    <span className="text-white font-semibold">{dashboard.overview.totalDocuments}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-400">Awaiting Signature</span>
                    </div>
                    <span className="text-white font-semibold">{dashboard.overview.documentsAwaitingSignature}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-orange-400" />
                      <span className="text-slate-400">Upcoming Deadlines</span>
                    </div>
                    <span className="text-white font-semibold">{dashboard.overview.upcomingDeadlines}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <span className="text-slate-400">Pending Tasks</span>
                    </div>
                    <span className="text-white font-semibold">{dashboard.overview.pendingTasks}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <span className="text-slate-400">Team Members</span>
                    </div>
                    <span className="text-white font-semibold">{dashboard.overview.teamMembers}</span>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {dashboard.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.details}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(activity.performedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboard.recentActivity.length === 0 && (
                    <p className="text-slate-400 text-sm">No recent activity</p>
                  )}
                </div>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  {dashboard.upcomingDeadlines.slice(0, 3).map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{deadline.title}</p>
                        <p className="text-xs text-slate-400">{deadline.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">
                          {new Date(deadline.dueDate).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          deadline.status === 'overdue' 
                            ? 'bg-red-500/10 text-red-400'
                            : deadline.status === 'due-soon'
                            ? 'bg-orange-500/10 text-orange-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}>
                          {deadline.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {dashboard.upcomingDeadlines.length === 0 && (
                    <p className="text-slate-400 text-sm">No upcoming deadlines</p>
                  )}
                </div>
              </Card>

              {/* Document Management Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Document Management</h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowDocuments(!showDocuments)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showDocuments ? 'Hide' : 'View'} Documents
                    </Button>
                    <Button
                      onClick={() => setShowDocumentUpload(true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Document
                    </Button>
                  </div>
                </div>
                
                {showDocuments && selectedCase && (
                  <CaseDocumentsList
                    caseId={selectedCase}
                    caseName={'Case ' + selectedCase}
                    onAddDocument={() => setShowDocumentUpload(true)}
                  />
                )}
              </Card>
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <Eye className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Select a Case</h3>
                <p className="text-slate-400">
                  Choose a case from the list to view its overview and details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocumentUpload && selectedCase && (
        <CaseDocumentUploadModal
          caseId={selectedCase}
          caseName={'Case ' + selectedCase}
          onClose={() => setShowDocumentUpload(false)}
          onSuccess={() => {
            setShowDocumentUpload(false);
            setShowDocuments(true);
            // Refresh documents list
          }}
        />
      )}
    </div>
  );
};
