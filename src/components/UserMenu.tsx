import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

export default function UserMenu() {
  const { currentUser, userProfile, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const roleLabel = userProfile?.role === 'employer' ? 'Hirer' : 'Job Seeker';
  const roleBadgeColor = userProfile?.role === 'employer'
    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-4 sm:py-2 cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black font-semibold text-xs">
          {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
        </div>
        <div className="hidden flex-col items-start text-left sm:flex">
          <span className="text-xs font-medium text-white max-w-[120px] truncate">
            {currentUser.email?.split('@')[0]}
          </span>
        </div>
        <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColor}`}>
          {roleLabel}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-white/20 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 z-50">
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">Account</p>
            <p className="truncate text-xs font-medium text-white mt-0.5">{currentUser.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColor}`}>
                {roleLabel}
              </span>
              <span className="text-[10px] text-neutral-400">
                • {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/dashboard');
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-neutral-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span>📊</span>
              <span>Portal Dashboard</span>
            </button>
          </div>

          <div className="border-t border-white/10 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors cursor-pointer"
            >
              <span>🚪</span>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
