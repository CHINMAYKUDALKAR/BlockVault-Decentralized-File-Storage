/**
 * Role-Based Access Control (RBAC) Types
 * ======================================
 * 
 * Defines the role-based access control system for BlockVault Legal
 * with different permission levels for different user roles.
 */

export type UserRole = 'lead-attorney' | 'associate' | 'paralegal' | 'client' | 'external-counsel';

export interface CaseMember {
  walletAddress: string;
  role: UserRole;
  name: string;
  email?: string;
  addedAt: Date;
  addedBy: string; // Wallet address of who added this member
}

export interface CasePermissions {
  // Case Management
  canViewCase: boolean;
  canCreateCase: boolean;
  canEditCaseDetails: boolean;
  canAddRemoveMembers: boolean;
  
  // Document Management
  canNotarizeDocuments: boolean;
  canViewAllDocuments: boolean;
  canCreateRedactions: boolean;
  
  // Secure Sharing
  canGrantRevokeAccess: boolean;
  canViewSharedByMe: boolean;
  canViewReceivedDocs: boolean;
  
  // Contract Execution
  canRequestSignatures: boolean;
  canFundEscrow: boolean;
  canSignDocuments: boolean;
  
  // AI Analysis
  canRunZKMLAnalysis: boolean;
}

export interface RolePermissionMatrix {
  [key: string]: CasePermissions;
}

export interface UserContext {
  walletAddress: string;
  currentRole?: UserRole;
  currentCaseId?: string;
  permissions?: CasePermissions;
}

// Permission matrix for each role
export const ROLE_PERMISSIONS: RolePermissionMatrix = {
  'lead-attorney': {
    // Case Management
    canViewCase: true,
    canCreateCase: true,
    canEditCaseDetails: true,
    canAddRemoveMembers: true,
    
    // Document Management
    canNotarizeDocuments: true,
    canViewAllDocuments: true,
    canCreateRedactions: true,
    
    // Secure Sharing
    canGrantRevokeAccess: true,
    canViewSharedByMe: true,
    canViewReceivedDocs: true,
    
    // Contract Execution
    canRequestSignatures: true,
    canFundEscrow: true,
    canSignDocuments: true,
    
    // AI Analysis
    canRunZKMLAnalysis: true,
  },
  
  associate: {
    // Case Management
    canViewCase: true,
    canCreateCase: true,
    canEditCaseDetails: false,
    canAddRemoveMembers: false,
    
    // Document Management
    canNotarizeDocuments: true,
    canViewAllDocuments: true,
    canCreateRedactions: true,
    
    // Secure Sharing
    canGrantRevokeAccess: true,
    canViewSharedByMe: true,
    canViewReceivedDocs: true,
    
    // Contract Execution
    canRequestSignatures: true,
    canFundEscrow: false,
    canSignDocuments: true,
    
    // AI Analysis
    canRunZKMLAnalysis: true,
  },
  
  paralegal: {
    // Case Management
    canViewCase: true,
    canCreateCase: false,
    canEditCaseDetails: false,
    canAddRemoveMembers: false,
    
    // Document Management
    canNotarizeDocuments: true,
    canViewAllDocuments: true,
    canCreateRedactions: false,
    
    // Secure Sharing
    canGrantRevokeAccess: false,
    canViewSharedByMe: false,
    canViewReceivedDocs: true,
    
    // Contract Execution
    canRequestSignatures: false,
    canFundEscrow: false,
    canSignDocuments: true,
    
    // AI Analysis
    canRunZKMLAnalysis: false,
  },
  
  client: {
    // Case Management
    canViewCase: false,
    canCreateCase: false,
    canEditCaseDetails: false,
    canAddRemoveMembers: false,
    
    // Document Management
    canNotarizeDocuments: false,
    canViewAllDocuments: false,
    canCreateRedactions: false,
    
    // Secure Sharing
    canGrantRevokeAccess: false,
    canViewSharedByMe: false,
    canViewReceivedDocs: true, // Only documents shared with them
    
    // Contract Execution
    canRequestSignatures: false,
    canFundEscrow: false,
    canSignDocuments: true, // Can sign documents they're required to sign
    
    // AI Analysis
    canRunZKMLAnalysis: false,
  },
  
  'external-counsel': {
    // Case Management
    canViewCase: false,
    canCreateCase: false,
    canEditCaseDetails: false,
    canAddRemoveMembers: false,
    
    // Document Management
    canNotarizeDocuments: false,
    canViewAllDocuments: false,
    canCreateRedactions: false,
    
    // Secure Sharing
    canGrantRevokeAccess: false,
    canViewSharedByMe: false,
    canViewReceivedDocs: true, // Only documents shared with them
    
    // Contract Execution
    canRequestSignatures: false,
    canFundEscrow: false,
    canSignDocuments: true, // Can sign documents they're required to sign
    
    // AI Analysis
    canRunZKMLAnalysis: false,
  },
};

// Helper function to get permissions for a role
export function getPermissionsForRole(role: UserRole): CasePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.client;
}

// Helper function to check if user has specific permission
export function hasPermission(userRole: UserRole, permission: keyof CasePermissions): boolean {
  const permissions = getPermissionsForRole(userRole);
  return permissions[permission];
}

// Helper function to get role display name
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    'lead-attorney': 'Lead Attorney',
    associate: 'Associate Attorney',
    paralegal: 'Paralegal',
    client: 'Client',
    'external-counsel': 'External Counsel',
  };
  return displayNames[role];
}

// Helper function to get role description
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    'lead-attorney': 'Full access to case management, document operations, and team coordination',
    associate: 'Broad access to document operations and sharing, limited administrative access',
    paralegal: 'Document management and organization, limited operational access',
    client: 'View-only access to documents shared with them, can sign required documents',
    'external-counsel': 'View-only access to documents shared with them, can sign required documents',
  };
  return descriptions[role];
}
