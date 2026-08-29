import { useEffect, useRef, useState } from 'react'
import { useTypewriter } from './useTypewriter'
import { useAuth } from './contexts/useAuth'
import AuthModal from './components/AuthModal'
import UserMenu from './components/UserMenu'
import { Link, useNavigate } from 'react-router-dom'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4'
const SENSITIVITY = 0.8
const EMAIL = 'stackalign@gmail.com'
const NAV_LINKS = ['Live HR Agent', 'AI Resume Builder and Project Finder'] as const
const PILL_LABELS = [
  'Live HR Agent',
  'AI Resume Builder and Project Finder'
] as const
const TYPEWRITER_TEXT =
  `We are building a platform to help you find the
perfect job and project.`

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="4"
        y="4"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect
        x="1"
        y="1"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-emerald-400"
    >
      <path
        d="M2.5 6.5L4.8 8.8L9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface AppProps {
  initialAuthMode?: 'login' | 'signup'
  forceAuthModal?: boolean
}

function App({ initialAuthMode, forceAuthModal = false }: AppProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pillsVisible, setPillsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT)
  const { currentUser, userProfile, openAuthModal, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (forceAuthModal && !currentUser) {
      openAuthModal(initialAuthMode || 'login')
    }
  }, [forceAuthModal, initialAuthMode, currentUser, openAuthModal])

  useEffect(() => {
    const t = window.setTimeout(() => setPillsVisible(true), 400)
    return () => window.clearTimeout(t)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let prevX: number | null = null
    let targetTime = 0
    let seeking = false

    const applySeek = () => {
      if (!Number.isFinite(video.duration) || video.duration === 0) return
      seeking = true
      video.currentTime = targetTime
    }

    const handlePointerMove = (clientX: number) => {
      if (prevX === null) {
        prevX = clientX
        return
      }

      const delta = clientX - prevX
      prevX = clientX

      if (!Number.isFinite(video.duration) || video.duration === 0) return

      const offset = (delta / window.innerWidth) * SENSITIVITY * video.duration
      targetTime = Math.max(0, Math.min(video.duration, targetTime + offset))

      if (!seeking) applySeek()
    }

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX)
      }
    }

    const onTouchEnd = () => {
      prevX = null
    }

    const onSeeked = () => {
      if (Math.abs(video.currentTime - targetTime) > 0.0005) {
        applySeek()
      } else {
        seeking = false
      }
    }

    const paintFirstFrame = () => {
      if (video.currentTime === 0) {
        video.currentTime = 0.001
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadeddata', paintFirstFrame)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadeddata', paintFirstFrame)
    }
  }, [])

  const copyEmail = () => {
    void navigator.clipboard.writeText(EMAIL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [isFadingOut, setIsFadingOut] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    const anim = requestAnimationFrame(() => setFadeIn(true))
    return () => cancelAnimationFrame(anim)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  const handleActionClick = () => {
    if (currentUser) {
      setIsFadingOut(true)
      setTimeout(() => {
        navigate('/analyzer')
      }, 450)
    } else {
      openAuthModal('signup')
    }
  }

  return (
    <div className={`relative min-h-[100dvh] w-full overflow-x-hidden bg-black text-white selection:bg-white selection:text-black transition-all duration-500 ease-in-out ${isFadingOut || !fadeIn ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
      {/* Background Interactive Video */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-[70%_center] sm:object-center"
      >
        <source src="/hero-bg.mp4" type='video/mp4; codecs="avc1.640028"' />
        <source src={VIDEO_SRC} type='video/mp4; codecs="hvc1"' />
      </video>

      {/* Background Overlay Vignette for mobile readability */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 sm:via-transparent sm:to-black/40" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 md:px-8 lg:px-12">
        <Link
          to="/"
          className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/80 bg-white/10 px-3 py-1.5 backdrop-blur-md transition hover:bg-white/20 sm:px-4 sm:py-2"
        >
          <span
            className="text-[17px] font-bold tracking-tight text-white sm:text-[20px] lg:text-[22px]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            StackAlign®
          </span>
          <span
            className="select-none text-[18px] text-emerald-400 sm:text-[20px] lg:text-[24px]"
            style={{ letterSpacing: '-0.02em' }}
          >
            ✳︎
          </span>
        </Link>

        {/* Desktop / Tablet Navigation Links */}
        <nav className="hidden items-center gap-1.5 rounded-2xl border border-white/80 bg-white/10 p-1 backdrop-blur-md lg:flex xl:gap-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black xl:px-4 xl:text-sm cursor-pointer"
            >
              {link}
            </button>
          ))}
        </nav>

        {/* Auth / User Section Desktop */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {currentUser ? (
            <UserMenu />
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="rounded-2xl border border-white/70 bg-white/5 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20 sm:px-5 sm:text-sm cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="rounded-2xl border border-white bg-white px-4 py-1.5 text-xs font-semibold text-black transition-all duration-200 hover:bg-transparent hover:text-white sm:px-5 sm:text-sm cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </div>

        {/* Mobile & Tablet Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          {currentUser && (
            <div className="scale-90 origin-right">
              <UserMenu />
            </div>
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/80 bg-white/10 backdrop-blur-md transition hover:bg-white/20 active:scale-95 cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <div className="flex flex-col items-center justify-center gap-1.5 w-5">
              <span
                className={`h-[2px] w-full bg-white transition-all duration-300 ${menuOpen ? 'translate-y-[8px] rotate-45' : ''
                  }`}
              />
              <span
                className={`h-[2px] w-full bg-white transition-all duration-300 ${menuOpen ? 'opacity-0 scale-0' : ''
                  }`}
              />
              <span
                className={`h-[2px] w-full bg-white transition-all duration-300 ${menuOpen ? '-translate-y-[8px] -rotate-45' : ''
                  }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-between overflow-y-auto bg-black/95 px-6 py-20 backdrop-blur-xl transition-all duration-300 lg:hidden sm:px-10 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
              Navigation Menu
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="rounded-full border border-white/20 p-1.5 text-xs text-neutral-300 hover:bg-white/10 cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {currentUser && (
            <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
              <p className="text-xs text-neutral-400">Signed in as</p>
              <p className="truncate font-semibold text-white mt-0.5">{currentUser.email}</p>
              <span className="mt-2 inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                {userProfile?.role === 'employer' ? 'Hirer / Recruiter' : 'Job Seeker'}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <button
                key={link}
                type="button"
                className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-left text-base sm:text-lg font-medium text-white transition hover:bg-white/15 cursor-pointer"
                onClick={() => {
                  closeMenu()
                  handleActionClick()
                }}
              >
                <span>{link}</span>
                <span className="text-neutral-500">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6">
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className="flex w-full items-center justify-center rounded-2xl border border-white bg-white py-3 text-base font-semibold text-black transition hover:bg-neutral-200"
                onClick={closeMenu}
              >
                Go to Dashboard →
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/20 cursor-pointer"
                onClick={async () => {
                  closeMenu()
                  await logout()
                }}
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center rounded-2xl border border-white/80 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20 cursor-pointer"
                onClick={() => {
                  closeMenu()
                  openAuthModal('login')
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className="flex items-center justify-center rounded-2xl border border-white bg-white py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 cursor-pointer"
                onClick={() => {
                  closeMenu()
                  openAuthModal('signup')
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 flex min-h-[100dvh] w-full flex-col justify-end px-4 pb-8 pt-24 sm:px-8 sm:pb-12 sm:pt-28 md:justify-center md:px-12 md:py-0 lg:px-16">
        <div className="mx-auto w-full max-w-2xl lg:max-w-3xl md:mx-0">
          {/* Blurred Teaser Text */}
          <p
            className="pointer-events-none mb-3 sm:mb-5 select-none text-white/90 text-[16px] leading-snug sm:text-[22px] md:text-[26px] lg:text-[28px]"
            style={{
              fontWeight: 400,
              filter: 'blur(3.5px)',
            }}
          >
            I can't find a job or project,
            <br />
            Find the requirements and apply for the job or project.
          </p>

          {/* Typewriter Mission Statement */}
          <p className="mb-6 sm:mb-8 text-white whitespace-pre-line text-[17px] leading-snug sm:text-[22px] md:text-[26px] lg:text-[28px] font-normal min-h-[2.8em]">
            {displayed}
            {!done && (
              <span className="cursor-blink ml-1 inline-block h-[1.1em] w-[2px] align-middle bg-white" />
            )}
          </p>

          {/* Action Pills */}
          <div
            className="flex flex-wrap items-center gap-2 sm:gap-2.5"
            style={{
              opacity: pillsVisible ? 1 : 0,
              transform: pillsVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            {PILL_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-medium text-black transition-all duration-200 hover:bg-black hover:text-white hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              >
                {label}
              </button>
            ))}

            {/* Email Reach Us Button (Next Line) */}
            <div className="w-full pt-1.5 sm:pt-2">
              <button
                type="button"
                onClick={copyEmail}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full border border-white/80 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs sm:px-5 sm:py-2 sm:text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black active:scale-95 cursor-pointer"
              >
                <span>
                  Reach us:{' '}
                  <span className="underline underline-offset-2">{EMAIL}</span>
                </span>
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Auth Modal */}
      <AuthModal />
    </div>
  )
}

export default App
