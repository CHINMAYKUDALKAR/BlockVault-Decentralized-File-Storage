/**
 * Test the permission mapping in RBAC context
 */

import { UserRole, getPermissionsForRole } from '../types/rbac';

// Simulate the actionPermissionMap from RBACContext
const actionPermissionMap: Record<string, keyof ReturnType<typeof getPermissionsForRole>> = {
  'view_case': 'canViewCase',
  'canCreateCase': 'canCreateCase',
  'edit_case': 'canEditCaseDetails',
  'manage_members': 'canAddRemoveMembers',
  'canNotarizeDocuments': 'canNotarizeDocuments',
  'view_documents': 'canViewAllDocuments',
  'canCreateRedactions': 'canCreateRedactions',
  'grant_access': 'canGrantRevokeAccess',
  'view_shared': 'canViewSharedByMe',
  'view_received': 'canViewReceivedDocs',
  'canRequestSignatures': 'canRequestSignatures',
  'fund_escrow': 'canFundEscrow',
  'canSignDocuments': 'canSignDocuments',
  'canRunZKMLAnalysis': 'canRunZKMLAnalysis',
};

export const testPermissionMapping = () => {
  console.log('🧪 Testing Permission Mapping...\n');
  
  const testRole: UserRole = 'lead-attorney';
  const permissions = getPermissionsForRole(testRole);
  
  console.log(`Testing role: ${testRole}`);
  console.log('='.repeat(50));
  
  // Test the specific action that was failing
  const action = 'canCreateCase';
  const permission = actionPermissionMap[action];
  
  console.log(`Action: ${action}`);
  console.log(`Mapped Permission: ${permission}`);
  console.log(`Permission Value: ${permissions[permission!]}`);
  console.log(`Result: ${permissions[permission!] ? '✅ ALLOWED' : '❌ DENIED'}`);
  
  // Test all actions
  console.log('\n📋 Testing all actions:');
  Object.entries(actionPermissionMap).forEach(([action, permission]) => {
    const hasPermission = permissions[permission];
    console.log(`${action}: ${hasPermission ? '✅' : '❌'}`);
  });
  
  return permissions[permission!];
};

export const testSpecificAction = (role: UserRole, action: string) => {
  const permissions = getPermissionsForRole(role);
  const permission = actionPermissionMap[action];
  
  if (!permission) {
    console.log(`❌ Action '${action}' not found in mapping`);
    return false;
  }
  
  const hasPermission = permissions[permission];
  console.log(`🔍 Testing '${action}' for ${role}: ${hasPermission ? '✅ ALLOWED' : '❌ DENIED'}`);
  
  return hasPermission;
};
