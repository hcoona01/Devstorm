import { createContext } from 'react';
import type { User, UserCredential } from 'firebase/auth';

export type UserRole = 'job_seeker' | 'employer';

export interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  techStack?: string;
  link?: string;
}

export interface UserCV {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string;
}

export interface UserProfile {
  email: string;
  role: UserRole;
  createdAt: string;
  displayName?: string;
  name?: string;
  current_target_role?: string;
  institution?: string;
  cgpa?: string;
  address?: string;
  bio?: string;
  current_skills?: Record<string, number>;
  projects?: ProjectItem[];
  cv?: UserCV;
  profileComplete?: boolean;
  [key: string]: any;
}

export interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  pendingProfileSetup: boolean;
  completeProfileSetup: () => void;
  startProfileSetup: () => void;
  signup: (email: string, password: string, role?: UserRole) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  loginWithGoogle: (role?: UserRole) => Promise<UserCredential>;
  logout: () => Promise<void>;
  updateProfileData?: (data: Partial<UserProfile>) => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

