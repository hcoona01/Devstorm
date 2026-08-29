import React, { useState } from 'react';
import TaskScheduler, { type ActionPlanTask } from './TaskScheduler';

interface ImprovementPoint {
  category: string;
  suggestion: string;
  original_text?: string | null;
  improved_text?: string | null;
}

interface AnalysisResults {
  match_score: number;
  missing_keywords: string[];
  scraped_insights: string[];
  improvement_points: ImprovementPoint[];
  action_plan?: ActionPlanTask[];
}

export default function ResumeAnalyzerView() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      try {
        const text = await file.text();
        setResumeText(text);
      } catch {
        setResumeText(`Candidate Resume File: ${file.name}`);
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a target Job Description.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('job_description', jobDescription);
      if (resumeFile) {
        payload.append('resume', resumeFile);
        payload.append('resume_text', resumeText || `Candidate Resume File: ${resumeFile.name}`);
      }

      const response = await fetch('/api/analyze-cv', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze CV. Please check backend connection.');
      }

      const data = (await response.json()) as AnalysisResults;

      // Ensure fallback mock data for testing if action_plan isn't sent
      if (!data.action_plan || data.action_plan.length === 0) {
        data.action_plan = [
          {
            id: 't1',
            title: 'Build FastAPI Microservice',
            description: 'Implement a REST API service with JWT authentication and Async Pydantic v2 schemas.',
            priority: 'High',
            estimated_time: '3 hours',
            github_repo_recommendation: 'tiangolo/fastapi',
          },
          {
            id: 't2',
            title: 'Containerize with Docker',
            description: 'Write a multi-stage Dockerfile optimizing production image size under 150MB.',
            priority: 'Medium',
            estimated_time: '2 hours',
            github_repo_recommendation: 'docker/awesome-compose',
          },
          {
            id: 't3',
            title: 'GraphQL Schema Setup',
            description: 'Integrate Apollo/GraphQL queries to address the JD backend requirements.',
            priority: 'Medium',
            estimated_time: '4 hours',
            github_repo_recommendation: 'graphql/graphql-js',
          },
        ];
      }

      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <h2 className="lab-section-title">
          AI Resume & CV Gap Analyzer
        </h2>
        <p className="lab-section-subtitle" style={{ margin: '6px auto 0', maxWidth: 460 }}>
          Upload your resume and paste a target Job Description for private,
          AI-powered keyword matching and skill recommendations.
        </p>
      </div>

      {/* Error */}
      {error && <div className="lab-error">{error}</div>}

      {/* Input Form */}
      <div className="lab-panel">
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="lab-label" style={{ display: 'block', marginBottom: 10 }}>
              Target Job Description
            </label>
            <textarea
              required
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description or project requirements here..."
              className="lab-textarea"
            />
          </div>

          <div>
            <label className="lab-label" style={{ display: 'block', marginBottom: 10 }}>
              Resume — PDF or DOCX, max 5 MB
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              className="lab-file-input"
            />
            {resumeFile && (
              <p className="lab-success" style={{ marginTop: 8 }}>
                ✓ Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <button type="submit" disabled={loading} className="lab-btn">
            {loading ? (
              <span className="lab-loading-pulse">Analyzing Resume and Job Description...</span>
            ) : (
              'Analyze Resume & Generate Roadmap'
            )}
          </button>
        </form>
      </div>

      {/* ── Results ────────────────────────────────────────── */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Score header row */}
          <div
            className="lab-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              borderBottom: 'none',
            }}
          >
            <div>
              <h3 className="lab-heading" style={{ fontSize: 20, margin: '0 0 4px' }}>
                Analysis Complete
              </h3>
              <p className="lab-body" style={{ margin: 0, fontSize: 12 }}>
                AI evaluated keywords, experience alignment, and action points.
              </p>
            </div>
            <div className="lab-annotation">
              <span className="lab-annotation-line">
                SCORE: <span className="lab-annotation-value lab-mono">{results.match_score}%</span>
              </span>
              <span className="lab-annotation-line">
                STATUS: <span className="lab-annotation-value">
                  {results.match_score >= 80 ? 'STRONG' : results.match_score >= 60 ? 'MODERATE' : 'NEEDS WORK'}
                </span>
              </span>
            </div>
          </div>

          {/* Score stat block */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 0 }}>
            <div className="lab-stat">
              <div className="lab-stat-value lab-mono">{results.match_score}%</div>
              <div className="lab-stat-label">JD Match Score</div>
            </div>
            <div className="lab-stat">
              <div className="lab-stat-value lab-mono" style={{ color: '#8B4C39' }}>
                {results.missing_keywords?.length || 0}
              </div>
              <div className="lab-stat-label">Missing Keywords</div>
            </div>
            <div className="lab-stat">
              <div className="lab-stat-value lab-mono">{results.improvement_points?.length || 0}</div>
              <div className="lab-stat-label">Improvements</div>
            </div>
            <div className="lab-stat">
              <div className="lab-stat-value lab-mono">{results.action_plan?.length || 0}</div>
              <div className="lab-stat-label">Action Items</div>
            </div>
          </div>

          {/* Missing Keywords */}
          {results.missing_keywords && results.missing_keywords.length > 0 && (
            <div className="lab-panel" style={{ borderTop: 'none' }}>
              <h4 className="lab-label" style={{ marginBottom: 14, color: '#8B4C39' }}>
                Missing Critical Keywords
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {results.missing_keywords.map((kw, i) => (
                  <span key={i} className="lab-tag lab-tag-alert">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {results.scraped_insights && results.scraped_insights.length > 0 && (
            <div className="lab-panel" style={{ borderTop: 'none' }}>
              <h4 className="lab-label" style={{ marginBottom: 14 }}>
                Scraped Profile Insights
              </h4>
              <div>
                {results.scraped_insights.map((insight, i) => (
                  <div key={i} className="lab-data-row">
                    <span className="lab-label lab-mono" style={{ flexShrink: 0, width: 28 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="lab-body" style={{ flex: 1, fontSize: 13 }}>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Points */}
          {results.improvement_points && results.improvement_points.length > 0 && (
            <div className="lab-panel" style={{ borderTop: 'none' }}>
              <h4 className="lab-label" style={{ marginBottom: 16, color: 'var(--lab-green)' }}>
                Resume Improvement Points
              </h4>
              <div>
                {results.improvement_points.map((pt, i) => (
                  <div key={i} className="lab-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="lab-label lab-mono" style={{ color: 'var(--lab-warm-gray)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="lab-tag lab-tag-ink">{pt.category}</span>
                    </div>
                    <p className="lab-body" style={{ fontWeight: 500, color: 'var(--lab-ink)', margin: 0 }}>
                      {pt.suggestion}
                    </p>
                    {pt.original_text && (
                      <div
                        style={{
                          background: 'var(--lab-paper)',
                          border: '1px solid var(--lab-border)',
                          padding: '12px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <p className="lab-body" style={{ color: 'var(--lab-warm-gray)', margin: 0, fontSize: 12 }}>
                          <strong>Original:</strong> {pt.original_text}
                        </p>
                        <p className="lab-body" style={{ color: 'var(--lab-green)', fontWeight: 600, margin: 0, fontSize: 12 }}>
                          <strong>Improved:</strong> {pt.improved_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Scheduler */}
          {results.action_plan && <TaskScheduler tasks={results.action_plan} />}
        </div>
      )}
    </div>
  );
}
