import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, CaseMember, CasePermissions, getPermissionsForRole, UserContext } from '../types/rbac';
import { UserProfile, loadUserProfile, saveUserProfile, createUserProfile } from '../types/userProfile';

interface RBACContextType {
  currentUser: UserContext | null;
  currentCaseMembers: CaseMember[];
  currentCaseId: string | null;
  userPermissions: CasePermissions | null;
  userProfile: UserProfile | null;
  isOnboarded: boolean;
  
  // Actions
  setCurrentUser: (user: UserContext) => void;
  setCurrentCase: (caseId: string, members: CaseMember[]) => void;
  updateUserRole: (walletAddress: string, newRole: UserRole) => void;
  addCaseMember: (member: CaseMember) => void;
  removeCaseMember: (walletAddress: string) => void;
  
  // User profile management
  loadUserProfile: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (role: UserRole, firmName?: string) => void;
  logoutFromFirm: () => void;
  changeRole: (newRole: UserRole) => void;
  
  // Permission checks
  hasPermission: (permission: keyof CasePermissions) => boolean;
  canPerformAction: (action: string) => boolean;
  
  // Role management
  getUserRole: (walletAddress: string) => UserRole | null;
  isCaseOwner: () => boolean;
  isTeamMember: () => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserContext | null>(null);
  const [currentCaseMembers, setCurrentCaseMembers] = useState<CaseMember[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<CasePermissions | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);

  // Update permissions when user role or case changes
  useEffect(() => {
    if (currentUser?.currentRole) {
      const permissions = getPermissionsForRole(currentUser.currentRole);
      setUserPermissions(permissions);
    } else {
      setUserPermissions(null);
    }
  }, [currentUser?.currentRole]);

  // Load user context and profile from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('rbac_user_context');
    if (savedUser) {
      try {
        const userContext = JSON.parse(savedUser);
        setCurrentUser(userContext);
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    }

    // Load user profile
    loadUserProfileFromStorage();
  }, []);

  // Save user context to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rbac_user_context', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const setCurrentUserContext = (user: UserContext) => {
    setCurrentUser(user);
  };

  const setCurrentCase = (caseId: string, members: CaseMember[]) => {
    setCurrentCaseId(caseId);
    setCurrentCaseMembers(members);
    
    // Update current user's role for this case
    if (currentUser) {
      const userMember = members.find(member => member.walletAddress === currentUser.walletAddress);
      if (userMember) {
        setCurrentUser({
          ...currentUser,
          currentRole: userMember.role,
          currentCaseId: caseId,
        });
      }
    }
  };

  const updateUserRole = (walletAddress: string, newRole: UserRole) => {
    setCurrentCaseMembers(prev => 
      prev.map(member => 
        member.walletAddress === walletAddress 
          ? { ...member, role: newRole }
          : member
      )
    );
    
    // Update current user's role if it's their address
    if (currentUser?.walletAddress === walletAddress) {
      setCurrentUser({
        ...currentUser,
        currentRole: newRole,
      });
    }
  };

  const addCaseMember = (member: CaseMember) => {
    setCurrentCaseMembers(prev => [...prev, member]);
  };

  const removeCaseMember = (walletAddress: string) => {
    setCurrentCaseMembers(prev => 
      prev.filter(member => member.walletAddress !== walletAddress)
    );
  };

  const hasPermission = (permission: keyof CasePermissions): boolean => {
    if (!userPermissions) return false;
    return userPermissions[permission];
  };

  const canPerformAction = (action: string): boolean => {
    if (!userPermissions) return false;
    
    // Map actions to permissions
    const actionPermissionMap: Record<string, keyof CasePermissions> = {
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
    
    const permission = actionPermissionMap[action];
    return permission ? hasPermission(permission) : false;
  };

  const getUserRole = (walletAddress: string): UserRole | null => {
    const member = currentCaseMembers.find(member => member.walletAddress === walletAddress);
    return member ? member.role : null;
  };

  const isCaseOwner = (): boolean => {
    return currentUser?.currentRole === 'lead-attorney';
  };

  const isTeamMember = (): boolean => {
    return currentCaseMembers.some(member => member.walletAddress === currentUser?.walletAddress);
  };

  // User profile management functions
  const loadUserProfileFromStorage = () => {
    const profile = loadUserProfile();
    setUserProfile(profile);
    setIsOnboarded(profile?.isOnboarded || false);
    
    // Update current user context if profile exists
    if (profile && profile.role) {
      setCurrentUser(prev => prev ? {
        ...prev,
        currentRole: profile.role,
        walletAddress: profile.walletAddress
      } : {
        walletAddress: profile.walletAddress,
        currentRole: profile.role,
        currentCaseId: undefined
      });
    }
  };

  const updateUserProfile = (profileUpdate: Partial<UserProfile>) => {
    if (!userProfile) return;
    
    const updatedProfile = { ...userProfile, ...profileUpdate };
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
  };

  const completeOnboarding = (role: UserRole, firmName?: string) => {
    if (!currentUser?.walletAddress) return;
    
    const newProfile = createUserProfile(currentUser.walletAddress, role, firmName);
    setUserProfile(newProfile);
    setIsOnboarded(true);
    saveUserProfile(newProfile);
    
    // Update current user context
    setCurrentUser(prev => prev ? {
      ...prev,
      currentRole: role
    } : {
      walletAddress: currentUser.walletAddress,
      currentRole: role,
      currentCaseId: undefined
    });
  };

  const logoutFromFirm = () => {
    // Clear user profile and RBAC context
    localStorage.removeItem('user_profile');
    localStorage.removeItem('rbac_user_context');
    setUserProfile(null);
    setCurrentUser(null);
    setIsOnboarded(false);
    setCurrentCaseId(null);
    setCurrentCaseMembers([]);
    setUserPermissions(null);
  };

  const changeRole = (newRole: UserRole) => {
    if (!userProfile || !currentUser) return;
    
    // Update user profile with new role
    const updatedProfile = {
      ...userProfile,
      role: newRole,
      lastUpdated: new Date().toISOString()
    };
    
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);
    
    // Update current user context
    setCurrentUser({
      ...currentUser,
      currentRole: newRole
    });
    
    // Update permissions based on new role
    const newPermissions = getPermissionsForRole(newRole);
    setUserPermissions(newPermissions);
  };

  const value: RBACContextType = {
    currentUser,
    currentCaseMembers,
    currentCaseId,
    userPermissions,
    userProfile,
    isOnboarded,
    setCurrentUser: setCurrentUserContext,
    setCurrentCase,
    updateUserRole,
    addCaseMember,
    removeCaseMember,
    loadUserProfile: loadUserProfileFromStorage,
    updateUserProfile,
    completeOnboarding,
    logoutFromFirm,
    changeRole,
    hasPermission,
    canPerformAction,
    getUserRole,
    isCaseOwner,
    isTeamMember,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};
