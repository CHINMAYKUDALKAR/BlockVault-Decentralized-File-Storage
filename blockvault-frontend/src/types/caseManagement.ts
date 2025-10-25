// Case Management Types for BlockVault Legal Platform

export interface CaseFile {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  clientName: string;
  matterNumber: string;
  practiceArea: PracticeArea;
  createdAt: Date;
  updatedAt: Date;
  leadAttorney: string; // Wallet address
  team: CaseTeamMember[];
  documents: CaseDocument[];
  tasks: CaseTask[];
  deadlines: CaseDeadline[];
  annotations: DocumentAnnotation[];
  accessControl: CaseAccessControl;
}

export type CaseStatus = 
  | 'active' 
  | 'on-hold' 
  | 'closed' 
  | 'archived';

export type CasePriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type PracticeArea = 
  | 'corporate' 
  | 'litigation' 
  | 'real-estate' 
  | 'family' 
  | 'criminal' 
  | 'immigration' 
  | 'intellectual-property' 
  | 'employment' 
  | 'tax' 
  | 'other';

export interface CaseTeamMember {
  walletAddress: string;
  role: TeamRole;
  name: string;
  email: string;
  permissions: Permission[];
  addedAt: Date;
  addedBy: string; // Wallet address of who added them
}

export type TeamRole = 
  | 'lead-attorney' 
  | 'associate' 
  | 'paralegal' 
  | 'client' 
  | 'external-counsel';

export type Permission = 
  | 'view' 
  | 'comment' 
  | 'edit' 
  | 'delete' 
  | 'share' 
  | 'manage-team';

export interface CaseAccessControl {
  caseId: string;
  permissions: Record<string, Permission[]>; // walletAddress -> permissions
  roleAssignments: Record<string, TeamRole>; // walletAddress -> role
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseDocument {
  id: string;
  caseId: string;
  originalFileId: string; // Reference to the encrypted file
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  parties: string[]; // Names of parties involved
  uploadedBy: string; // Wallet address
  uploadedAt: Date;
  notarizedAt?: Date;
  blockchainHash?: string;
  ipfsCid?: string;
  zkProof?: string;
  metadata: DocumentMetadata;
  annotations: DocumentAnnotation[];
  versions: DocumentVersion[];
  accessLevel: AccessLevel;
}

export type DocumentType = 
  | 'contract' 
  | 'motion' 
  | 'evidence' 
  | 'deposition-transcript' 
  | 'correspondence' 
  | 'pleading' 
  | 'brief' 
  | 'discovery' 
  | 'exhibit' 
  | 'other';

export type DocumentStatus = 
  | 'draft' 
  | 'under-review' 
  | 'awaiting-signature' 
  | 'executed' 
  | 'filed' 
  | 'archived';

export type AccessLevel = 
  | 'public' 
  | 'team-only' 
  | 'confidential' 
  | 'privileged';

export interface DocumentMetadata {
  documentType: DocumentType;
  status: DocumentStatus;
  parties: string[];
  tags: string[];
  description: string;
  confidentialityLevel: AccessLevel;
  retentionPeriod?: number; // Days
  createdBy: string;
  lastModifiedBy: string;
  lastModifiedAt: Date;
}

export interface DocumentVersion {
  version: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
  changes: string;
  ipfsCid: string;
  zkProof: string;
}

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  description: string;
  assignedTo: string; // Wallet address
  assignedBy: string; // Wallet address
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  documentIds: string[]; // Related documents
  comments: TaskComment[];
  blockchainTxId?: string; // For audit trail
}

export type TaskStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled' 
  | 'overdue';

export type TaskPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export interface TaskComment {
  id: string;
  taskId: string;
  author: string; // Wallet address
  content: string;
  createdAt: Date;
  blockchainTxId?: string;
}

export interface CaseDeadline {
  id: string;
  caseId: string;
  title: string;
  description: string;
  dueDate: Date;
  type: DeadlineType;
  status: DeadlineStatus;
  createdBy: string;
  assignedTo: string[];
  reminderSent: boolean;
  blockchainTxId?: string;
}

export type DeadlineType = 
  | 'filing' 
  | 'discovery' 
  | 'hearing' 
  | 'trial' 
  | 'settlement' 
  | 'other';

export type DeadlineStatus = 
  | 'upcoming' 
  | 'due-soon' 
  | 'overdue' 
  | 'completed' 
  | 'cancelled';

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  author: string; // Wallet address
  content: string;
  position: AnnotationPosition;
  createdAt: Date;
  updatedAt: Date;
  isEncrypted: boolean;
  ipfsCid: string;
  blockchainHash: string;
  replies: AnnotationReply[];
}

export interface AnnotationPosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  selectedText?: string;
}

export interface AnnotationReply {
  id: string;
  annotationId: string;
  author: string;
  content: string;
  createdAt: Date;
  blockchainHash: string;
}

export interface DiscoveryBundle {
  id: string;
  caseId: string;
  title: string;
  description: string;
  documentIds: string[];
  bundleHash: string;
  zkProof: string;
  createdAt: Date;
  createdBy: string;
  status: BundleStatus;
  sharedWith: string[]; // Wallet addresses
  blockchainTxId: string;
}

export type BundleStatus = 
  | 'creating' 
  | 'ready' 
  | 'shared' 
  | 'verified' 
  | 'expired';

export interface AuditTrail {
  id: string;
  caseId: string;
  documentId?: string;
  action: AuditAction;
  performedBy: string;
  performedAt: Date;
  details: string;
  blockchainTxId: string;
  ipfsCid?: string;
  metadata: Record<string, any>;
}

export type AuditAction = 
  | 'document-uploaded' 
  | 'document-notarized' 
  | 'document-shared' 
  | 'document-redacted' 
  | 'task-created' 
  | 'task-completed' 
  | 'team-member-added' 
  | 'permission-granted' 
  | 'permission-revoked' 
  | 'annotation-added' 
  | 'bundle-created' 
  | 'audit-report-generated';

export interface CaseDashboard {
  caseId: string;
  overview: CaseOverview;
  recentActivity: AuditTrail[];
  upcomingDeadlines: CaseDeadline[];
  pendingTasks: CaseTask[];
  documentStats: DocumentStats;
  teamActivity: TeamActivity[];
}

export interface CaseOverview {
  totalDocuments: number;
  documentsAwaitingSignature: number;
  upcomingDeadlines: number;
  pendingTasks: number;
  recentActivity: number;
  teamMembers: number;
  lastUpdated: Date;
}

export interface DocumentStats {
  total: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  byAccessLevel: Record<AccessLevel, number>;
  totalSize: number; // Bytes
  averageSize: number; // Bytes
}

export interface TeamActivity {
  member: string;
  action: string;
  timestamp: Date;
  documentId?: string;
  taskId?: string;
}

// API Response Types
export interface CaseListResponse {
  cases: CaseFile[];
  total: number;
  page: number;
  limit: number;
}

export interface CaseDetailResponse {
  case: CaseFile;
  dashboard: CaseDashboard;
  auditTrail: AuditTrail[];
}

export interface TaskListResponse {
  tasks: CaseTask[];
  total: number;
  page: number;
  limit: number;
}

export interface DocumentListResponse {
  documents: CaseDocument[];
  total: number;
  page: number;
  limit: number;
}

// Filter and Search Types
export interface CaseFilter {
  status?: CaseStatus[];
  priority?: CasePriority[];
  practiceArea?: PracticeArea[];
  teamMember?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface DocumentFilter {
  documentType?: DocumentType[];
  status?: DocumentStatus[];
  accessLevel?: AccessLevel[];
  uploadedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignedTo?: string;
  dueDateRange?: {
    start: Date;
    end: Date;
  };
}
