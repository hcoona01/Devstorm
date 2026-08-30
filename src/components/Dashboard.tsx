import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Link } from 'react-router-dom';

import LabHeader from './LabHeader';
import type { ProjectItem } from '../contexts/authContextInstance';
import './analyzer/AnalyzerTool.css';

export default function Dashboard() {
  const { currentUser, userProfile, updateProfileData } = useAuth();


  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Exact data from Firebase
  const [displayName, setDisplayName] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // Add item temp states
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillScore, setNewSkillScore] = useState(8);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjStack, setNewProjStack] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjLink, setNewProjLink] = useState('');

  // CV Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvMsg, setCvMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || userProfile.name || '');
      setTargetRole(userProfile.current_target_role || '');
      setInstitution(userProfile.institution || '');
      setCgpa(userProfile.cgpa || '');
      setAddress(userProfile.address || '');
      setBio(userProfile.bio || '');
      setSkills(userProfile.current_skills || {});
      setProjects(userProfile.projects || []);
    }
  }, [userProfile]);

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!updateProfileData) return;

    try {
      setSaveStatus('Saving profile updates to Firebase...');
      await updateProfileData({
        displayName,
        name: displayName,
        current_target_role: targetRole,
        institution,
        cgpa,
        address,
        bio,
        current_skills: skills,
        projects,
      });
      setSaveStatus('✓ Profile updated successfully in Firebase');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus('Error saving profile: ' + (err?.message || 'Check connection'));
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    const key = newSkillName.trim().toLowerCase().replace(/\s+/g, '_');
    const updated = { ...skills, [key]: Number(newSkillScore) };
    setSkills(updated);
    setNewSkillName('');
    if (updateProfileData) {
      await updateProfileData({ current_skills: updated });
    }
  };

  const handleRemoveSkill = async (key: string) => {
    const copy = { ...skills };
    delete copy[key];
    setSkills(copy);
    if (updateProfileData) {
      await updateProfileData({ current_skills: copy });
    }
  };

  const handleAddProject = async () => {
    if (!newProjTitle.trim()) return;
    const newP: ProjectItem = {
      id: 'p_' + Date.now(),
      title: newProjTitle.trim(),
      description: newProjDesc.trim(),
      techStack: newProjStack.trim(),
      link: newProjLink.trim(),
    };
    const updated = [newP, ...projects];
    setProjects(updated);
    setNewProjTitle('');
    setNewProjStack('');
    setNewProjDesc('');
    setNewProjLink('');
    if (updateProfileData) {
      await updateProfileData({ projects: updated });
    }
  };

  const handleRemoveProject = async (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    if (updateProfileData) {
      await updateProfileData({ projects: updated });
    }
  };

  const handleCVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCvMsg('File size exceeds 5MB limit.');
      return;
    }

    setUploadingCV(true);
    setCvMsg('Uploading resume...');
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const cvData = {
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };
      if (updateProfileData) {
        await updateProfileData({ cv: cvData });
      }
      setUploadingCV(false);
      setCvMsg(`✓ Uploaded "${file.name}"`);
      setTimeout(() => setCvMsg(null), 4000);
    };
    reader.onerror = () => {
      setUploadingCV(false);
      setCvMsg('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const currentCV = userProfile?.cv;
  const userEmail = currentUser?.email || userProfile?.email || '';
  const actualName = displayName || userProfile?.name || userEmail.split('@')[0] || 'User Profile';
  const roleLabel = userProfile?.role === 'employer' ? 'Hirer / Employer' : 'Job Seeker';

  return (
    <div className="lab-page opacity-100">
      
      {/* Hidden File Picker for Resume */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleCVUpload}
        style={{ display: 'none' }}
      />

      {/* Responsive Lab Header with Uniform Logo */}
      <LabHeader
        activeTag="Profile Hub"
        onEditProfileToggle={() => setIsEditing(!isEditing)}
        isEditingProfile={isEditing}
        showOnlyHomeAndLogout={true}
      />



      {/* Save Status Banner */}
      {saveStatus && (
        <div style={{
          position: 'fixed',
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          border: '1px solid var(--lab-ink)',
          background: 'var(--lab-ink)',
          color: 'var(--lab-white)',
          padding: '10px 20px',
          fontFamily: 'var(--lab-body)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {saveStatus}
        </div>
      )}

      {/* Hero Section */}
      <section className="lab-hero" style={{ minHeight: 'auto', padding: '48px 24px 36px' }}>
        <span className="lab-hero-meta">
          StackAlign · Candidate Profile & Live Context Hub · 2026
        </span>
        <h1 className="lab-hero-title" style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 12px' }}>
          Candidate Profile & Career Dashboard
        </h1>
        <p className="lab-hero-subtitle" style={{ marginBottom: 20 }}>
          Manage your background context, technical skills matrix, and uploaded resume. Synchronized in real-time with Firebase to power your AI tools.
        </p>
        <div className="lab-hero-actions" style={{ flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
          <button
            type="button"
            className="lab-btn"
            style={{ width: 'auto', padding: '10px 22px' }}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '✕ Cancel Editing' : '✎ Edit Profile Context'}
          </button>
          <button
            type="button"
            className="lab-btn-outline"
            style={{ width: 'auto', padding: '10px 22px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCV}
          >
            {uploadingCV ? 'Uploading…' : '↑ Upload Resume / CV'}
          </button>
        </div>
      </section>

      {/* Main Profile Content */}
      <main className="lab-content" style={{ paddingTop: 32 }}>
        
        {/* Section Identifier Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
            <h2 className="lab-section-title">Profile Data Context</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="lab-tag lab-tag-green">Firebase Synced</span>
              <span className="lab-label">Protocol v3.2</span>
            </div>
          </div>
          <p className="lab-section-subtitle">
            Recorded profile details, skills ratings, and projects feed into Gemini AI for generating personalized roadmaps and resume gap analyses.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 1. MAIN PROFILE SUMMARY CARD */}
          <div className="lab-panel-warm" style={{ borderLeft: '4px solid var(--lab-ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span className="lab-mono" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    background: 'var(--lab-ink)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                  }}>
                    {actualName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3 className="lab-heading" style={{ fontSize: 24, margin: 0, lineHeight: 1.2 }}>
                      {actualName}
                    </h3>
                    <span className="lab-tag lab-tag-ink" style={{ marginTop: 4 }}>● {roleLabel}</span>
                  </div>
                </div>
                <p className="lab-body" style={{ margin: '4px 0 0', fontWeight: 600, color: 'var(--lab-ink)', fontSize: 15 }}>
                  {targetRole || 'Target Role: Not specified yet'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="lab-btn-sm"
                >
                  {isEditing ? '✕ Close Edit' : '✎ Edit Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCV}
                  className="lab-btn-sm"
                  style={{ background: 'var(--lab-ink)', color: '#fff' }}
                >
                  {uploadingCV ? 'Uploading…' : '↑ Upload CV'}
                </button>
              </div>
            </div>

            {/* Profile Info Details Grid */}
            <div className="lab-grid-3" style={{ gap: 16, marginBottom: 16 }}>
              <div>
                <span className="lab-label">Institution / College</span>
                <p className="lab-body" style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--lab-ink)', fontWeight: 500 }}>
                  {institution || 'Not set'}
                </p>
              </div>
              <div>
                <span className="lab-label">Grade / CGPA</span>
                <p className="lab-body" style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--lab-ink)', fontWeight: 500 }}>
                  {cgpa || 'Not set'}
                </p>
              </div>
              <div>
                <span className="lab-label">Account Email</span>
                <p className="lab-body lab-mono" style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--lab-ink)' }}>
                  {userEmail}
                </p>
              </div>
            </div>

            {/* Attached CV Banner */}
            {currentCV && (
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                border: '1px solid var(--lab-border)',
                background: 'var(--lab-white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="lab-label">Attached Resume:</span>
                    <strong className="lab-heading" style={{ fontSize: 13 }}>{currentCV.name}</strong>
                  </div>
                  <span className="lab-body lab-mono" style={{ fontSize: 11 }}>
                    {(currentCV.size / 1024).toFixed(1)} KB · Uploaded {new Date(currentCV.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                {currentCV.dataUrl && (
                  <a
                    href={currentCV.dataUrl}
                    download={currentCV.name}
                    className="lab-btn-sm"
                  >
                    ↓ Download Resume
                  </a>
                )}
              </div>
            )}
            {cvMsg && <p className="lab-success" style={{ marginTop: 10 }}>{cvMsg}</p>}
          </div>

          {/* 2. INLINE PROFILE EDIT FORM */}
          {isEditing && (
            <div className="lab-panel" style={{ border: '2px solid var(--lab-ink)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--lab-border)' }}>
                <h3 className="lab-heading" style={{ fontSize: 18, margin: 0 }}>
                  Edit Profile Information
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="lab-btn-sm"
                >
                  ✕ Close Form
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="lab-grid-3" style={{ gap: 16 }}>
                  <div>
                    <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>Full Name</label>
                    <input
                      type="text"
                      className="lab-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>Target Headline / Role</label>
                    <input
                      type="text"
                      className="lab-input"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Full-Stack Developer"
                    />
                  </div>
                  <div>
                    <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>Institution / University</label>
                    <input
                      type="text"
                      className="lab-input"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. State University"
                    />
                  </div>
                </div>

                <div className="lab-grid-3" style={{ gap: 16 }}>
                  <div>
                    <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>CGPA / Score</label>
                    <input
                      type="text"
                      className="lab-input"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 3.8 / 4.0"
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>Location / Address</label>
                    <input
                      type="text"
                      className="lab-input"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>Professional Bio / About</label>
                  <textarea
                    rows={3}
                    className="lab-textarea"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief overview of your background, experience, and interests..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="lab-btn-outline"
                    style={{ width: 'auto', padding: '10px 20px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="lab-btn"
                    style={{ width: 'auto', padding: '10px 24px' }}
                  >
                    Save Changes to Firebase →
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. ABOUT / BIO CARD */}
          <div className="lab-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="lab-label">About / Bio</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="lab-btn-sm"
              >
                ✎ Edit
              </button>
            </div>
            <p className="lab-body" style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 13, lineHeight: 1.7, color: 'var(--lab-ink)' }}>
              {bio || 'No bio added yet. Click edit to add a summary of your professional background.'}
            </p>
          </div>

          {/* 4. ACADEMIC RECORD CARD */}
          <div className="lab-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--lab-border)' }}>
              <span className="lab-label">Education & Academic Record</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="lab-btn-sm"
              >
                ✎ Edit
              </button>
            </div>

            <div className="lab-data-row">
              <div>
                <span className="lab-label" style={{ display: 'block', marginBottom: 2 }}>Institution</span>
                <strong className="lab-heading" style={{ fontSize: 15 }}>{institution || 'Institution name not set'}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="lab-label" style={{ display: 'block', marginBottom: 2 }}>Grade / CGPA</span>
                <span className="lab-tag lab-tag-green lab-mono" style={{ fontSize: 12 }}>{cgpa || 'N/A'}</span>
              </div>
            </div>

            {address && (
              <div className="lab-data-row">
                <div>
                  <span className="lab-label" style={{ display: 'block', marginBottom: 2 }}>Location</span>
                  <span className="lab-body" style={{ fontSize: 13 }}>{address}</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. SKILLS MATRIX CARD */}
          <div className="lab-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--lab-border)' }}>
              <div>
                <h3 className="lab-heading" style={{ fontSize: 18, margin: 0 }}>
                  Skills ({Object.keys(skills).length})
                </h3>
                <span className="lab-label lab-mono">Recorded Technical Matrix</span>
              </div>
            </div>

            {Object.keys(skills).length === 0 ? (
              <p className="lab-body" style={{ fontSize: 13, marginBottom: 16 }}>No skills added yet. Add your top skills below:</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {Object.entries(skills).map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      border: '1px solid var(--lab-border)',
                      background: 'var(--lab-paper)',
                      padding: '6px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span className="lab-body" style={{ fontSize: 12, fontWeight: 500, color: 'var(--lab-ink)', textTransform: 'capitalize' }}>
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="lab-tag lab-tag-ink lab-mono">{v}/10</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(k)}
                      style={{ background: 'none', border: 'none', color: '#8B4C39', cursor: 'pointer', fontSize: 11, padding: 0 }}
                      title="Remove skill"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Skill Form */}
            <div style={{ borderTop: '1px solid var(--lab-border)', paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                className="lab-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Add a new skill (e.g. Python, Docker)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />
              <select
                className="lab-input"
                style={{ width: 'auto' }}
                value={newSkillScore}
                onChange={(e) => setNewSkillScore(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    Rating: {n}/10
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="lab-btn-sm"
                onClick={handleAddSkill}
              >
                + Add Skill
              </button>
            </div>
          </div>

          {/* 6. PORTFOLIO PROJECTS CARD */}
          <div className="lab-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--lab-border)' }}>
              <div>
                <h3 className="lab-heading" style={{ fontSize: 18, margin: 0 }}>
                  Projects ({projects.length})
                </h3>
                <span className="lab-label lab-mono">Recorded Portfolio Entries</span>
              </div>
            </div>

            {projects.length === 0 ? (
              <p className="lab-body" style={{ fontSize: 13, marginBottom: 20 }}>No projects added yet. Add a project below:</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: '1px solid var(--lab-border)',
                      background: 'var(--lab-paper)',
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong className="lab-heading" style={{ fontSize: 15 }}>{p.title}</strong>
                        {p.techStack && <span className="lab-tag lab-tag-ink lab-mono">{p.techStack}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(p.id)}
                        style={{ background: 'none', border: 'none', color: '#8B4C39', cursor: 'pointer', fontSize: 11 }}
                        title="Delete project"
                      >
                        Delete ✕
                      </button>
                    </div>
                    {p.description && <p className="lab-body" style={{ fontSize: 12, marginBottom: 8 }}>{p.description}</p>}
                    {p.link && (
                      <a
                        href={p.link.startsWith('http') ? p.link : `https://${p.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="lab-btn-sm"
                        style={{ fontSize: 10, padding: '4px 10px' }}
                      >
                        View Project ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Project Form */}
            <div style={{ border: '1px solid var(--lab-border)', background: 'var(--lab-paper-warm)', padding: 16 }}>
              <span className="lab-label-dark" style={{ display: 'block', marginBottom: 12 }}>+ Add New Project</span>
              <div className="lab-grid-3" style={{ gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  className="lab-input"
                  placeholder="Project Title"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                />
                <input
                  type="text"
                  className="lab-input"
                  placeholder="Tech Stack (e.g. React, Python)"
                  value={newProjStack}
                  onChange={(e) => setNewProjStack(e.target.value)}
                />
                <input
                  type="text"
                  className="lab-input"
                  placeholder="Project / GitHub Link (optional)"
                  value={newProjLink}
                  onChange={(e) => setNewProjLink(e.target.value)}
                />
              </div>
              <textarea
                rows={2}
                className="lab-textarea"
                placeholder="Brief project description..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                style={{ minHeight: 60, marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="lab-btn-sm"
                  onClick={handleAddProject}
                >
                  + Add Project
                </button>
              </div>
            </div>
          </div>

          {/* 7. QUICK LAUNCH INSTRUMENTS */}
          <div className="lab-grid-3" style={{ gap: 16, marginTop: 8 }}>
            <div className="lab-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="lab-label">Module 01</span>
                <h4 className="lab-heading" style={{ fontSize: 16, margin: '4px 0 8px' }}>AI Resume Analyzer & Job Finder</h4>
                <p className="lab-body" style={{ fontSize: 12, marginBottom: 16 }}>
                  Analyze your resume against target roles, discover skill gaps, and match live positions.
                </p>
              </div>
              <Link to="/analyzer" className="lab-btn-sm">
                Launch Analyzer ↗
              </Link>
            </div>

            <div className="lab-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="lab-label">Module 02</span>
                <h4 className="lab-heading" style={{ fontSize: 16, margin: '4px 0 8px' }}>Personalized Roadmap Guide</h4>
                <p className="lab-body" style={{ fontSize: 12, marginBottom: 16 }}>
                  Generate a personalized 4-stage career roadmap and interactive kanban task manager with Gemini AI.
                </p>
              </div>
              <Link to="/roadmap" className="lab-btn-sm">
                Launch Roadmap ↗
              </Link>
            </div>

            <div className="lab-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="lab-label">Navigation</span>
                <h4 className="lab-heading" style={{ fontSize: 16, margin: '4px 0 8px' }}>Home Showcase</h4>
                <p className="lab-body" style={{ fontSize: 12, marginBottom: 16 }}>
                  Return to the primary StackAlign hero showcase landing page.
                </p>
              </div>
              <Link to="/" className="lab-btn-sm">
                Go to Home ↗
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
