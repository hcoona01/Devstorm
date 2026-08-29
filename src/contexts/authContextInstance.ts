import { createContext } from 'react';
import type { User, UserCredential } from 'firebase/auth';

export type UserRole = 'job_seeker' | 'employer';

export interface UserProfile {
  email: string;
  role: UserRole;
  createdAt: string;
  displayName?: string;
  profileComplete?: boolean;
}

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingProfileSetup: boolean;
  completeProfileSetup: () => void;
  signup: (email: string, password: string, role?: UserRole) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
