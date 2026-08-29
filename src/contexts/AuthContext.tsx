import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { ref, set, update, onValue, type Unsubscribe } from 'firebase/database';
import { auth, db } from '../firebase';
import { 
  AuthContext, 
  type AuthContextType, 
  type UserProfile, 
  type UserRole 
} from './authContextInstance';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [pendingProfileSetup, setPendingProfileSetup] = useState(false);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  async function signup(email: string, password: string, role: UserRole = 'job_seeker') {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const newProfile: UserProfile = {
      email: user.email || email,
      role: role,
      createdAt: new Date().toISOString(),
    };

    await set(ref(db, 'users/' + user.uid), newProfile);
    setUserProfile(newProfile);

    return userCredential;
  }

  function login(email: string, password: string) {
    setPendingProfileSetup(false);
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setPendingProfileSetup(false);
    setUserProfile(null);
    await signOut(auth);
    window.location.assign('/');
  }

  async function updateProfileData(data: Partial<UserProfile>) {
    if (!auth.currentUser) return;
    const userRef = ref(db, 'users/' + auth.currentUser.uid);
    const sanitized = JSON.parse(JSON.stringify(data));
    await update(userRef, sanitized);
    setUserProfile((prev) => (prev ? { ...prev, ...data } : (data as UserProfile)));
  }

  function completeProfileSetup() {
    setPendingProfileSetup(false);
  }

  function startProfileSetup() {
    setPendingProfileSetup(true);
  }

  useEffect(() => {
    let dbUnsubscribe: Unsubscribe | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        const userRef = ref(db, 'users/' + user.uid);
        dbUnsubscribe = onValue(userRef, (snapshot) => {
          const data = snapshot.val() as UserProfile | null;
          setUserProfile(data);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user profile:', error);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        if (dbUnsubscribe) {
          dbUnsubscribe();
          dbUnsubscribe = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (dbUnsubscribe) {
        dbUnsubscribe();
      }
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    pendingProfileSetup,
    completeProfileSetup,
    startProfileSetup,
    signup,
    login,
    logout,
    updateProfileData,
    authModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
