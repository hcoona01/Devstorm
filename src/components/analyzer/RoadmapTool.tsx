import { useState, useEffect } from 'react';
import LabHeader from '../LabHeader';
import PersonalizedRoadmapView from './PersonalizedRoadmapView';
import './AnalyzerTool.css';


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

export default function RoadmapTool() {
  const [pageVisible, setPageVisible] = useState(false);

  useEffect(() => {
    const anim = requestAnimationFrame(() => {
      setPageVisible(true);
      document.querySelectorAll('.lab-hero-reveal').forEach((el) => {
        el.classList.add('visible');
      });
    });
    return () => cancelAnimationFrame(anim);
  }, []);

  useRevealObserver();

  const scrollToContent = () => {
    const el = document.getElementById('lab-roadmap-content');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`lab-page transition-all duration-500 ease-out ${pageVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Responsive Lab Header with Uniform StackAlign Logo */}
      <LabHeader activeTag="Roadmap Guide" />


      {/* Hero Section */}
      <section className="lab-hero">
        <span className="lab-hero-meta lab-hero-reveal">
          StackAlign · AI Career Roadmap & Certification Engine · 2026
        </span>
        <h1 className="lab-hero-title lab-hero-reveal delay-1">
          Personalized Career Roadmap &<br />
          Certification Guide
        </h1>
        <p className="lab-hero-subtitle lab-hero-reveal delay-2">
          Describe your technical target or specialization in natural language. Gemini AI merges your exact goals with your Firebase profile background to produce a tailored 4-stage job readiness roadmap and kanban task manager.
        </p>
        <div className="lab-hero-actions lab-hero-reveal delay-3">
          <button type="button" className="lab-btn" onClick={scrollToContent}>
            Build My Roadmap
          </button>
        </div>
      </section>

      {/* Tool Content */}
      <main className="lab-content" id="lab-roadmap-content">
        <div className="lab-reveal" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 className="lab-section-title">Personalized Roadmap Instrument</h2>
            <span className="lab-label">Engine v3.0</span>
          </div>
          <p className="lab-section-subtitle">
            An autonomous career strategy engine. Powered by your live Firebase skills/projects profile & Google Gemini AI.
          </p>
        </div>

        <div className="lab-reveal" style={{ marginTop: 24 }}>
          <PersonalizedRoadmapView />
        </div>
      </main>
    </div>
  );
}
