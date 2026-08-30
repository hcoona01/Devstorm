import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import './analyzer/AnalyzerTool.css';

interface LabHeaderProps {
  activeTag?: string;
  onEditProfileToggle?: () => void;
  isEditingProfile?: boolean;
  showOnlyHomeAndLogout?: boolean;
}

export default function LabHeader({
  activeTag,
  onEditProfileToggle,
  isEditingProfile,
  showOnlyHomeAndLogout = false,
}: LabHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const isMinimalNav = showOnlyHomeAndLogout || location.pathname !== '/hr-agent';

  const navItems = isMinimalNav
    ? []
    : [
        { label: 'Live HR Agent', path: '/hr-agent' },
        { label: 'AI Resume Analyzer & Job Finder', path: '/analyzer' },
        { label: 'Personalized Roadmap Guide', path: '/roadmap' },
      ];



  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--lab-border)',
        background: 'rgba(245, 243, 240, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '10px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Uniform StackAlign Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 14,
              border: '1px solid var(--lab-border)',
              background: 'var(--lab-white)',
              padding: '6px 14px',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease',
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--lab-ink)',
                fontFamily: 'var(--lab-heading)',
              }}
            >
              StackAlign®
            </span>
            <img
              src="/logo.png"
              alt="StackAlign Logo"
              style={{ height: 20, width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {activeTag && (
            <span className="lab-tag lab-tag-ink" style={{ display: 'none' }}>
              {activeTag}
            </span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          className="lab-desktop-nav"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="lab-btn-sm"
                style={{
                  fontSize: 10,
                  padding: '6px 12px',
                  background: isActive ? 'var(--lab-ink)' : 'transparent',
                  color: isActive ? 'var(--lab-white)' : 'var(--lab-ink)',
                  borderColor: 'var(--lab-ink)',
                }}
              >
                {item.label}
              </Link>
            );
          })}

          {onEditProfileToggle && (
            <button
              type="button"
              onClick={onEditProfileToggle}
              className="lab-btn-sm"
              style={{ fontSize: 10, padding: '6px 12px' }}
            >
              {isEditingProfile ? '✕ Cancel Edit' : '✎ Edit Profile'}
            </button>
          )}

          <Link
            to="/"
            className="lab-btn-sm"
            style={{ fontSize: 10, padding: '6px 12px' }}
          >
            Home
          </Link>

          {currentUser ? (
            <button
              type="button"
              onClick={logout}
              className="lab-btn-sm"
              style={{
                fontSize: 10,
                padding: '6px 12px',
                borderColor: '#8B4C39',
                color: '#8B4C39',
              }}
            >
              Log Out
            </button>
          ) : (
            <Link
              to="/login"
              className="lab-btn-sm"
              style={{ fontSize: 10, padding: '6px 12px' }}
            >
              Log In
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lab-mobile-toggle cursor-pointer"
          style={{
            display: 'none',
            padding: '8px 12px',
            border: '1px solid var(--lab-border)',
            background: 'var(--lab-white)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--lab-ink)',
            cursor: 'pointer',
          }}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 56,
            zIndex: 50,
            background: 'rgba(245, 243, 240, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--lab-border)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="lab-label" style={{ marginBottom: 4 }}>
              Navigation Menu
            </span>

            {currentUser && (
              <div
                style={{
                  border: '1px solid var(--lab-border)',
                  background: 'var(--lab-white)',
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <span className="lab-label" style={{ fontSize: 9 }}>Signed in as</span>
                <p className="lab-heading" style={{ fontSize: 13, margin: '2px 0 0' }}>
                  {userProfile?.name || userProfile?.displayName || currentUser.email}
                </p>
              </div>
            )}

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="lab-btn-outline"
                style={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  fontSize: 11,
                  background: location.pathname === item.path ? 'var(--lab-paper-warm)' : 'transparent',
                }}
              >
                <span>{item.label}</span>
                <span>→</span>
              </Link>
            ))}

            {onEditProfileToggle && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onEditProfileToggle();
                }}
                className="lab-btn-outline"
                style={{
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  fontSize: 11,
                }}
              >
                <span>{isEditingProfile ? '✕ Cancel Edit' : '✎ Edit Profile Context'}</span>
                <span>→</span>
              </button>
            )}

            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="lab-btn-outline"
              style={{
                justifyContent: 'space-between',
                padding: '12px 16px',
                fontSize: 11,
              }}
            >
              <span>Home Showcase</span>
              <span>→</span>
            </Link>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid var(--lab-border)' }}>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="lab-btn"
                style={{
                  background: '#8B4C39',
                  borderColor: '#8B4C39',
                }}
              >
                Log Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="lab-btn"
              >
                Log In / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
