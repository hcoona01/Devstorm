import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResumeAnalyzerView from './ResumeAnalyzerView';
import JobMatchesView from './JobMatchesView';
import './AnalyzerTool.css';

/**
 * IntersectionObserver hook — adds 'visible' class to .lab-reveal elements
 * when they enter the viewport. Respects prefers-reduced-motion.
 */
function useRevealObserver() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll('.lab-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });
}

export default function AnalyzerTool() {
  const [activeTab, setActiveTab] = useState<'resume' | 'jobs'>('resume');

  // Hero reveal on load via requestAnimationFrame
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    requestAnimationFrame(() => {
      document.querySelectorAll('.lab-hero-reveal').forEach((el) => {
        el.classList.add('visible');
      });
    });
  }, []);

  // Reveal observer for content sections
  useRevealObserver();

  const scrollToContent = () => {
    const el = document.getElementById('lab-tool-content');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lab-page">
      {/* ── Minimal Back Link (no full navbar) ─────────────── */}
      <Link to="/" className="lab-back">
        ← Home
      </Link>

      {/* ── Opening Statement (Hero) ───────────────────────── */}
      <section className="lab-hero">
        <span className="lab-hero-meta lab-hero-reveal">
          StackAlign · AI Career Tools · 2026
        </span>
        <h1 className="lab-hero-title lab-hero-reveal delay-1">
          Resume Builder &<br />
          Project Finder
        </h1>
        <p className="lab-hero-subtitle lab-hero-reveal delay-2">
          Upload your resume, paste a job description, and let AI identify
          gaps, generate improvements, and surface live roles that fit
          your exact stack.
        </p>
        <div className="lab-hero-actions lab-hero-reveal delay-3">
          <button type="button" className="lab-btn" onClick={scrollToContent}>
            Begin Analysis
          </button>
          <button
            type="button"
            className="lab-btn-outline"
            onClick={() => { setActiveTab('jobs'); scrollToContent(); }}
          >
            Find Jobs
          </button>
        </div>
      </section>

      {/* ── Tool Content ───────────────────────────────────── */}
      <main className="lab-content" id="lab-tool-content">
        {/* Section identifier */}
        <div className="lab-reveal" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 className="lab-section-title">Instruments</h2>
            <span className="lab-label">Protocol v2.1</span>
          </div>
          <p className="lab-section-subtitle">
            Two modules — one for rebuilding your resume against a target
            role, one for surfacing live positions that match your skills.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="lab-tabs lab-reveal">
          <button
            type="button"
            className={`lab-tab ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            01 — Resume Builder & Gap Analyzer
          </button>
          <button
            type="button"
            className={`lab-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            02 — Live Jobs & Project Matcher
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: 32 }}>
          <div className="lab-reveal">
            {activeTab === 'resume' ? <ResumeAnalyzerView /> : <JobMatchesView />}
          </div>
        </div>
      </main>
    </div>
  );
}
