/**
 * Debug utility for checking user permissions
 */

import { UserRole, getPermissionsForRole } from '../types/rbac';

export const debugUserPermissions = (role: UserRole) => {
  console.log('=== USER PERMISSIONS DEBUG ===');
  console.log('User Role:', role);
  
  const permissions = getPermissionsForRole(role);
  console.log('Permissions:', permissions);
  
  console.log('Can Create Case:', permissions.canCreateCase);
  console.log('Can Notarize Documents:', permissions.canNotarizeDocuments);
  console.log('Can Create Redactions:', permissions.canCreateRedactions);
  console.log('Can Sign Documents:', permissions.canSignDocuments);
  console.log('Can Request Signatures:', permissions.canRequestSignatures);
  console.log('Can Run ZKML Analysis:', permissions.canRunZKMLAnalysis);
  
  console.log('=== END DEBUG ===');
  
  return permissions;
};

export const testPermissionCheck = (role: UserRole, permission: keyof typeof permissions) => {
  const permissions = getPermissionsForRole(role);
  const hasPermission = permissions[permission];
  
  console.log(`Testing permission: ${permission} for role: ${role}`);
  console.log(`Result: ${hasPermission ? 'ALLOWED' : 'DENIED'}`);
  
  return hasPermission;
};
