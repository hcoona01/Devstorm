import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LabHeader from './LabHeader';
import './analyzer/AnalyzerTool.css';

export default function LiveHRAgentPage() {
  const [pageVisible, setPageVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const anim = requestAnimationFrame(() => {
      setPageVisible(true);
      document.querySelectorAll('.lab-hero-reveal').forEach((el) => {
        el.classList.add('visible');
      });
    });
    return () => cancelAnimationFrame(anim);
  }, []);

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    setPageVisible(false);
    setTimeout(() => {
      navigate('/');
    }, 450);
  };

  return (
    <div className={`lab-page transition-all duration-500 ease-out ${pageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Responsive Lab Header with Uniform StackAlign Logo */}
      <LabHeader activeTag="Live HR Agent" />

      {/* Hero / Announcement Section */}
      <section className="lab-hero" style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="lab-hero-meta lab-hero-reveal">
          <span className="lab-tag lab-tag-alert" style={{ marginRight: 8 }}>● UNDER DEVELOPMENT</span>
          StackAlign · AI Voice & Interview Agent
        </span>

        <h1 className="lab-hero-title lab-hero-reveal delay-1" style={{ marginTop: 12 }}>
          Live HR Agent
        </h1>

        <div className="lab-hero-reveal delay-2" style={{ margin: '16px auto 24px', maxWidth: 580 }}>
          <div style={{
            border: '1px solid var(--lab-border)',
            background: 'var(--lab-paper-warm)',
            padding: '20px 24px',
            textAlign: 'center'
          }}>
            <h2 className="lab-heading" style={{ fontSize: 20, margin: '0 0 8px', color: '#8B4C39' }}>
              Coming Soon
            </h2>
            <p className="lab-body" style={{ fontSize: 15, margin: 0, fontWeight: 500, color: 'var(--lab-ink)' }}>
              The facility is under development.
            </p>
          </div>
        </div>

        <p className="lab-hero-subtitle lab-hero-reveal delay-3" style={{ maxWidth: 540 }}>
          Our real-time interactive HR voice agent and automated mock interviewer module is undergoing final model alignment and speech evaluation. It will be available in the upcoming platform update.
        </p>

        <div className="lab-hero-actions lab-hero-reveal delay-4" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          <a href="/" onClick={handleGoHome} className="lab-btn" style={{ width: 'auto', padding: '12px 24px' }}>
            ← Return to Home Showcase
          </a>
          <Link to="/analyzer" className="lab-btn-outline" style={{ width: 'auto', padding: '12px 24px' }}>
            Launch AI Resume Analyzer
          </Link>
          <Link to="/roadmap" className="lab-btn-outline" style={{ width: 'auto', padding: '12px 24px' }}>
            Launch Roadmap Guide
          </Link>
        </div>
      </section>
    </div>
  );
}
