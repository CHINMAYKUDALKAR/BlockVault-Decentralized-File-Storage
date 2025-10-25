/**
 * User Profile Types
 * ==================
 * 
 * Defines the user profile structure for BlockVault Legal
 * including role, firm information, and onboarding status.
 */

import { UserRole } from './rbac';

export interface UserProfile {
  walletAddress: string;
  role: UserRole;
  firmName?: string;
  firmId?: string;
  onboardedAt: string;
  isOnboarded: boolean;
  lastLoginAt?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    autoSave?: boolean;
  };
}

export interface FirmInfo {
  id: string;
  name: string;
  address: string;
  members: FirmMember[];
  createdAt: string;
  updatedAt: string;
}

export interface FirmMember {
  walletAddress: string;
  role: UserRole;
  name: string;
  email?: string;
  addedAt: string;
  addedBy: string;
  isActive: boolean;
}

// Helper functions for user profile management
export const createUserProfile = (
  walletAddress: string,
  role: UserRole,
  firmName?: string
): UserProfile => {
  return {
    walletAddress,
    role,
    firmName,
    onboardedAt: new Date().toISOString(),
    isOnboarded: true,
    lastLoginAt: new Date().toISOString(),
    preferences: {
      theme: 'dark',
      notifications: true,
      autoSave: true,
    },
  };
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem('user_profile', JSON.stringify(profile));
};

export const loadUserProfile = (): UserProfile | null => {
  try {
    const profileData = localStorage.getItem('user_profile');
    if (!profileData) return null;
    
    const profile = JSON.parse(profileData) as UserProfile;
    
    // Update last login time
    profile.lastLoginAt = new Date().toISOString();
    saveUserProfile(profile);
    
    return profile;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
};

export const clearUserProfile = (): void => {
  localStorage.removeItem('user_profile');
};

export const isUserOnboarded = (): boolean => {
  const profile = loadUserProfile();
  return profile?.isOnboarded || false;
};

export const getUserRole = (): UserRole | null => {
  const profile = loadUserProfile();
  return profile?.role || null;
};

export const isLegalProfessional = (role?: UserRole): boolean => {
  const userRole = role || getUserRole();
  return userRole === 'lead-attorney' || userRole === 'associate' || userRole === 'paralegal';
};

export const canCreateCases = (role?: UserRole): boolean => {
  const userRole = role || getUserRole();
  return userRole === 'lead-attorney' || userRole === 'associate';
};

export const canManageTeam = (role?: UserRole): boolean => {
  const userRole = role || getUserRole();
  return userRole === 'lead-attorney';
};
