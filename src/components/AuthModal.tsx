import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import type { UserRole } from '../contexts/authContextInstance';

interface AuthModalProps {
  initialMode?: 'login' | 'signup';
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

const ANIMATION_DURATION = 2000; // 2 seconds

export default function AuthModal({
  initialMode,
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const { 
    authModalOpen, 
    authModalMode, 
    closeAuthModal, 
    login, 
    signup,
    loginWithGoogle,
    startProfileSetup,
  } = useAuth();

  const isVisible = isOpen !== undefined ? isOpen : authModalOpen;
  const defaultMode = initialMode || authModalMode;

  const [mounted, setMounted] = useState(isVisible);
  const [animatingIn, setAnimatingIn] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | null>(null);
  const mode = activeTab || defaultMode;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState<UserRole>('job_seeker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle(role);
      triggerClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Google Auth error:', err);
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (authErr.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by browser. Please allow popups.');
      } else if (authErr.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is currently disabled in Firebase Console. Please enable Google under Authentication -> Sign-in method in Firebase Console.');
      } else {
        setError(authErr.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Synchronize opening / closing with 2-second fade without synchronous setState in effect body
  useEffect(() => {
    let animFrame: number;
    if (isVisible) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      animFrame = requestAnimationFrame(() => {
        setMounted(true);
        requestAnimationFrame(() => {
          setAnimatingIn(true);
        });
      });
    } else if (mounted) {
      animFrame = requestAnimationFrame(() => {
        setAnimatingIn(false);
      });
      closeTimeoutRef.current = setTimeout(() => {
        setMounted(false);
      }, ANIMATION_DURATION);
    }

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isVisible, mounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  const triggerClose = () => {
    setAnimatingIn(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setMounted(false);
      setActiveTab(null);
      setError('');
      if (onClose) onClose();
      else closeAuthModal();
    }, ANIMATION_DURATION);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== passwordConfirm) {
        return setError('Passwords do not match.');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
    }

    try {
      setLoading(true);
      if (mode === 'signup') {
        await signup(email, password, role);
      } else {
        await login(email, password);
      }
      triggerClose();
      if (mode === 'signup') {
        window.setTimeout(startProfileSetup, ANIMATION_DURATION);
      }
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (authErr.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in.');
      } else if (authErr.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (authErr.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(authErr.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity ease-in-out ${
        animatingIn ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{
        transitionDuration: `${ANIMATION_DURATION}ms`,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) triggerClose();
      }}
    >
      <div 
        className={`relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl border border-white/20 bg-gradient-to-b from-neutral-900/95 to-black/95 p-5 shadow-2xl sm:p-8 backdrop-blur-xl transition-all ease-in-out ${
          animatingIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{
          transitionDuration: `${ANIMATION_DURATION}ms`,
        }}
      >
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Top Header Buttons: Home & Close */}
        <button
          type="button"
          onClick={() => {
            triggerClose();
            window.location.href = '/';
          }}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <span>←</span> Home
        </button>

        <button
          type="button"
          onClick={triggerClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-neutral-400 transition-colors hover:border-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-5 sm:mb-6 text-center pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur-sm mb-2.5 sm:mb-3">
            <span>StackAlign®</span>
            <span className="text-emerald-400">✳︎</span>
            <span className="text-white/60">Portal</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400">
            {mode === 'login'
              ? 'Enter your credentials to access your portal'
              : 'Join StackAlign to find jobs or hire top talent'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mb-5 sm:mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setError('');
            }}
            className={`flex-1 rounded-lg py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 sm:mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs sm:text-sm text-red-200 animate-in fade-in">
            <span className="text-red-400 font-bold">!</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 transition focus:border-white focus:bg-white/10 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 transition focus:border-white focus:bg-white/10 focus:outline-none"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 transition focus:border-white focus:bg-white/10 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-300">
                  I want to:
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('job_seeker')}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                      role === 'job_seeker'
                        ? 'border-white bg-white/15 text-white'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span className="text-sm sm:text-base">💼</span>
                    <span className="text-xs font-semibold text-white">Job Seeker</span>
                    <span className="text-[10px] text-neutral-400 leading-tight">Find jobs & projects</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                      role === 'employer'
                        ? 'border-white bg-white/15 text-white'
                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span className="text-sm sm:text-base">🏢</span>
                    <span className="text-xs font-semibold text-white">Hirer / Recruiter</span>
                    <span className="text-[10px] text-neutral-400 leading-tight">Post jobs & hire talent</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 sm:py-3 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {mode === 'signup' ? 'Creating Account...' : 'Logging in...'}
              </span>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Log In'
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative bg-neutral-950 px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            OR
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-2.5 sm:py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continue with Google
        </button>

        {/* Footer switch */}
        <div className="mt-5 sm:mt-6 text-center text-xs text-neutral-400 pb-1">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError('');
                }}
                className="font-medium text-white underline underline-offset-2 hover:text-neutral-200 cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                }}
                className="font-medium text-white underline underline-offset-2 hover:text-neutral-200 cursor-pointer"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
