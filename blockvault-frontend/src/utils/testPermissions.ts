/**
 * Test script to verify RBAC permissions are working correctly
 */

import { UserRole, getPermissionsForRole } from '../types/rbac';

export const testAllPermissions = () => {
  console.log('🧪 Testing RBAC Permissions...\n');
  
  const roles: UserRole[] = ['lead-attorney', 'associate', 'paralegal', 'client', 'external-counsel'];
  
  roles.forEach(role => {
    console.log(`\n📋 Testing role: ${role}`);
    console.log('='.repeat(50));
    
    const permissions = getPermissionsForRole(role);
    
    // Test case creation permission
    console.log(`✅ Can Create Case: ${permissions.canCreateCase ? 'YES' : 'NO'}`);
    
    // Test document permissions
    console.log(`📄 Can Notarize Documents: ${permissions.canNotarizeDocuments ? 'YES' : 'NO'}`);
    console.log(`🔒 Can Create Redactions: ${permissions.canCreateRedactions ? 'YES' : 'NO'}`);
    console.log(`✍️ Can Sign Documents: ${permissions.canSignDocuments ? 'YES' : 'NO'}`);
    console.log(`📝 Can Request Signatures: ${permissions.canRequestSignatures ? 'YES' : 'NO'}`);
    
    // Test AI analysis permission
    console.log(`🤖 Can Run ZKML Analysis: ${permissions.canRunZKMLAnalysis ? 'YES' : 'NO'}`);
    
    // Test case management permissions
    console.log(`👁️ Can View Case: ${permissions.canViewCase ? 'YES' : 'NO'}`);
    console.log(`✏️ Can Edit Case Details: ${permissions.canEditCaseDetails ? 'YES' : 'NO'}`);
    console.log(`👥 Can Add/Remove Members: ${permissions.canAddRemoveMembers ? 'YES' : 'NO'}`);
  });
  
  console.log('\n🎯 Expected Results:');
  console.log('- Lead Attorney: Should be able to create cases ✅');
  console.log('- Associate: Should be able to create cases ✅');
  console.log('- Paralegal: Should NOT be able to create cases ❌');
  console.log('- Client: Should NOT be able to create cases ❌');
  console.log('- External Counsel: Should NOT be able to create cases ❌');
  
  return true;
};

// Test specific permission for a role
export const testPermission = (role: UserRole, permission: keyof ReturnType<typeof getPermissionsForRole>) => {
  const permissions = getPermissionsForRole(role);
  const result = permissions[permission];
  
  console.log(`🔍 Testing ${permission} for ${role}: ${result ? '✅ ALLOWED' : '❌ DENIED'}`);
  
  return result;
};
