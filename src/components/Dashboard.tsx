import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Link } from 'react-router-dom';
import type { ProjectItem } from '../contexts/authContextInstance';

export default function Dashboard() {
  const { currentUser, userProfile, logout, updateProfileData } = useAuth();


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
      setSaveStatus('Saving changes to Firebase...');
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
      setSaveStatus('✓ Profile updated successfully in Firebase!');
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setSaveStatus('Error saving: ' + (err?.message || 'Check database connection'));
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
    <div className="min-h-screen bg-[#f3f2ef] text-[#191919] font-sans antialiased pb-16">
      
      {/* Hidden File Picker for Resume */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleCVUpload}
        className="hidden"
      />

      {/* Top LinkedIn Style Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-[#0a66c2] font-black text-2xl tracking-tighter">
              <span>in</span>
            </Link>
            <span className="text-sm font-semibold text-neutral-800">
              StackAlign Profile
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/analyzer"
              className="flex items-center gap-1 rounded-full bg-[#0a66c2] text-white px-3.5 py-1 text-xs font-semibold hover:bg-[#004182] transition shadow-sm"
            >
              ⚡ AI Resume & Project Finder
            </Link>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 rounded-full border border-[#0a66c2] px-4 py-1 text-xs font-semibold text-[#0a66c2] transition hover:bg-[#0a66c2]/10 cursor-pointer"
            >
              <span>{isEditing ? '✕ Cancel Edit' : '✎ Edit Profile'}</span>
            </button>

            <Link
              to="/"
              className="rounded-full border border-neutral-300 px-3.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100"
            >
              Home
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-neutral-100 px-3.5 py-1 text-xs font-medium text-neutral-700 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Save Status Toast */}
      {saveStatus && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#191919] px-5 py-2 text-xs font-semibold text-white shadow-lg animate-bounce">
          {saveStatus}
        </div>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-4 pt-6 space-y-4">
        
        {/* Quick Launch Tool Banner */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#0a66c2] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">New Tool</span>
              <h2 className="text-sm font-bold text-neutral-900">AI Resume Builder & Project Finder</h2>
            </div>
            <p className="text-xs text-neutral-600">
              Run AI keyword gap-analysis on your resume, track drag-and-drop learning roadmaps, and match with live jobs.
            </p>
          </div>
          <Link
            to="/analyzer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a66c2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-sm shrink-0"
          >
            <span>Launch Tool ↗</span>
          </Link>
        </div>
        
        {/* 1. MAIN PROFILE CARD */}
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          {/* Header Banner */}
          <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-[#0a66c2] via-[#004182] to-[#002244] relative" />

          {/* Profile Header Content */}
          <div className="relative px-6 pb-6 pt-0">
            {/* Overlapping Avatar */}
            <div className="-mt-16 sm:-mt-20 mb-4 flex items-end justify-between">
              <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-full border-4 border-white bg-[#0a66c2] text-4xl sm:text-5xl font-bold text-white shadow-md">
                {actualName.charAt(0).toUpperCase()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-full border border-[#0a66c2] bg-white px-4 py-1.5 text-xs font-semibold text-[#0a66c2] hover:bg-[#0a66c2]/10 transition cursor-pointer"
                >
                  ✎ Edit Intro
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCV}
                  className="rounded-full bg-[#0a66c2] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition cursor-pointer shadow-sm"
                >
                  {uploadingCV ? 'Uploading...' : 'Upload CV / Resume'}
                </button>
              </div>
            </div>

            {/* Profile Intro Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                  {actualName}
                </h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  ● {roleLabel}
                </span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200">
                  Firebase Sync Active
                </span>
              </div>

              <p className="text-sm sm:text-base font-medium text-neutral-800">
                {targetRole || 'Target Role: Not set'}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 pt-1">
                {institution && <span>🏛 {institution}</span>}
                {cgpa && <span>🎓 CGPA: <strong className="text-neutral-700">{cgpa}</strong></span>}
                {address && <span>📍 {address}</span>}
                <span className="font-mono text-neutral-600">✉ {userEmail}</span>
              </div>
            </div>

            {/* Attached CV Quick Pill */}
            {currentCV && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-xl">📄</span>
                  <div className="overflow-hidden">
                    <p className="truncate text-xs font-bold text-neutral-800">{currentCV.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      {(currentCV.size / 1024).toFixed(1)} KB • Uploaded {new Date(currentCV.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {currentCV.dataUrl && (
                  <a
                    href={currentCV.dataUrl}
                    download={currentCV.name}
                    className="shrink-0 rounded-lg bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition"
                  >
                    ↓ Download Resume
                  </a>
                )}
              </div>
            )}
            {cvMsg && <p className="text-xs font-semibold text-emerald-600 mt-2">{cvMsg}</p>}
          </div>
        </section>

        {/* 2. INLINE EDIT FORM (When editing mode is toggled) */}
        {isEditing && (
          <section className="rounded-2xl border border-blue-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h2 className="text-base font-bold text-neutral-900">Edit Profile Information</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Target Headline / Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Full-Stack Developer"
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Institution / University</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. State University"
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">CGPA / Score</label>
                  <input
                    type="text"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 3.8 / 4.0"
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">About / Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief professional summary..."
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border border-neutral-300 px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0a66c2] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-sm cursor-pointer"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 3. ABOUT SECTION CARD */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-neutral-900">About</h2>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-[#0a66c2] hover:underline font-semibold cursor-pointer"
            >
              ✎ Edit
            </button>
          </div>
          <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
            {bio || 'No bio added yet. Click edit to add a summary of your professional background.'}
          </p>
        </section>

        {/* 4. EDUCATION & ACADEMIC RECORD CARD */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-neutral-900">Education & Academic Record</h2>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-[#0a66c2] hover:underline font-semibold cursor-pointer"
            >
              ✎ Edit
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
              🏛
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-neutral-900">
                {institution || 'Institution name not set'}
              </h3>
              {cgpa && (
                <p className="text-xs font-medium text-neutral-700">
                  Grade / CGPA: <span className="font-semibold text-emerald-700">{cgpa}</span>
                </p>
              )}
              {address && <p className="text-xs text-neutral-500">{address}</p>}
            </div>
          </div>
        </section>

        {/* 5. SKILLS SECTION CARD */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">
              Skills ({Object.keys(skills).length})
            </h2>
          </div>

          {Object.keys(skills).length === 0 ? (
            <p className="text-xs text-neutral-500">No skills added yet. Add your top skills below:</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(skills).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-medium text-neutral-800"
                >
                  <span className="capitalize">{k.replace(/_/g, ' ')}</span>
                  <span className="rounded-full bg-[#0a66c2]/10 px-1.5 py-0.2 text-[10px] font-bold text-[#0a66c2]">
                    {v}/10
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(k)}
                    className="text-neutral-400 hover:text-red-500 text-[11px] cursor-pointer ml-0.5"
                    title="Remove skill"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Skill Form */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
            <input
              type="text"
              placeholder="Add a new skill (e.g. Python, Docker)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="flex-1 min-w-[180px] rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
            />
            <select
              value={newSkillScore}
              onChange={(e) => setNewSkillScore(Number(e.target.value))}
              className="rounded-lg border border-neutral-300 p-2 text-xs focus:border-[#0a66c2] focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  Rating: {n}/10
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-lg bg-[#0a66c2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition cursor-pointer"
            >
              + Add Skill
            </button>
          </div>
        </section>

        {/* 6. PROJECTS SECTION CARD */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">
              Projects ({projects.length})
            </h2>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-neutral-500">No projects added yet. Add a project below:</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {projects.map((p) => (
                <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900">{p.title}</h3>
                      {p.techStack && (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600">
                          {p.techStack}
                        </span>
                      )}
                    </div>
                    {p.description && <p className="text-xs text-neutral-600">{p.description}</p>}
                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-semibold text-[#0a66c2] hover:underline pt-0.5"
                      >
                        View Project ↗
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(p.id)}
                    className="text-neutral-400 hover:text-red-500 text-xs cursor-pointer p-1"
                    title="Delete project"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Add Project Form */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-800">+ Add New Project</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Project Title"
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                className="rounded-lg border border-neutral-300 p-2 text-xs bg-white focus:border-[#0a66c2] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Tech Stack (e.g. React, Python)"
                value={newProjStack}
                onChange={(e) => setNewProjStack(e.target.value)}
                className="rounded-lg border border-neutral-300 p-2 text-xs bg-white focus:border-[#0a66c2] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Project / GitHub Link (optional)"
                value={newProjLink}
                onChange={(e) => setNewProjLink(e.target.value)}
                className="rounded-lg border border-neutral-300 p-2 text-xs bg-white focus:border-[#0a66c2] focus:outline-none sm:col-span-2"
              />
              <textarea
                rows={2}
                placeholder="Brief project description..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 p-2 text-xs bg-white focus:border-[#0a66c2] focus:outline-none resize-none sm:col-span-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddProject}
                className="rounded-lg bg-[#0a66c2] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition cursor-pointer"
              >
                + Add Project
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
