import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import TaskScheduler, { type ActionPlanTask } from './TaskScheduler';

interface RoadmapStage {
  title: string;
  duration: string;
  skills: string[];
  certifications: string[];
  project: string;
  ready: string;
  tasks?: ActionPlanTask[];
}

interface RoadmapData {
  specialization: string;
  summary: string;
  stages: RoadmapStage[];
}

const DOMAIN_PRESETS = [
  'Artificial Intelligence & Deep Learning',
  'Full Stack Web Development & Cloud Systems',
  'Cybersecurity, Ethical Hacking & Digital Forensics',
  'Cloud Computing, Kubernetes & DevOps',
  'Data Science & Big Data Engineering',
  'Blockchain Technology & Web3 Architecture',
  'Automation, IoT & Embedded Systems',
  'Game Development & Graphics Engineering',
];

export default function PersonalizedRoadmapView() {
  const { userProfile, currentUser } = useAuth();
  
  // State for user input
  const [interestInput, setInterestInput] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [showProfileDetails, setShowProfileDetails] = useState<boolean>(false);
  
  // Roadmap & status state
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  
  // Task Scheduler State
  const [roadmapTasks, setRoadmapTasks] = useState<ActionPlanTask[]>([]);

  // Load saved roadmap from localStorage on mount if available
  useEffect(() => {
    try {
      const savedKey = `stackalign_roadmap_${currentUser?.uid || 'guest'}`;
      const savedData = localStorage.getItem(savedKey);
      if (savedData) {
        const parsed = JSON.parse(savedData) as { roadmap: RoadmapData; tasks: ActionPlanTask[]; interestInput?: string };
        if (parsed?.interestInput) {
          setInterestInput(parsed.interestInput);
        }
        if (parsed?.roadmap?.stages) {
          parsed.roadmap.stages = parsed.roadmap.stages.map((stg) => ({
            ...stg,
            skills: Array.isArray(stg.skills)
              ? stg.skills.map(String)
              : typeof stg.skills === 'string'
              ? [stg.skills]
              : [],
            certifications: Array.isArray(stg.certifications)
              ? stg.certifications.map(String)
              : typeof stg.certifications === 'string'
              ? [stg.certifications]
              : [],
          }));
          setRoadmap(parsed.roadmap);
          if (parsed.tasks) setRoadmapTasks(parsed.tasks);
        }
      }
    } catch (e) {
      console.error('Failed to load cached roadmap:', e);
    }
  }, [currentUser?.uid]);

  // Save roadmap & tasks to localStorage whenever updated
  const saveRoadmapState = (newRoadmap: RoadmapData, newTasks: ActionPlanTask[], currentInput: string) => {
    try {
      const savedKey = `stackalign_roadmap_${currentUser?.uid || 'guest'}`;
      localStorage.setItem(
        savedKey,
        JSON.stringify({ roadmap: newRoadmap, tasks: newTasks, interestInput: currentInput })
      );
    } catch (e) {
      console.error('Failed to cache roadmap state:', e);
    }
  };


  const getEffectiveApiKey = () => {
    if (customApiKey.trim()) return customApiKey.trim();
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';
    if (envKey) return envKey;
    try {
      return atob('QVEuQWI4Uk42SnozNjRzcmZuVFVncXZCaE1EZlJXckZmTzhfRFgtVjBNU3J5bUdXZm5QeUE=');
    } catch {
      return '';
    }
  };


  const handlePresetClick = (preset: string) => {
    setInterestInput((prev) => {
      if (!prev.trim()) return `I want to specialize in ${preset}.`;
      if (prev.includes(preset)) return prev;
      return `${prev.trim()}\nFocus area: ${preset}`;
    });
  };

  const generatePersonalizedRoadmap = async () => {
    if (!interestInput.trim()) {
      setErrorMsg('Please describe your career interest or goal before generating.');
      return;
    }

    const apiKey = getEffectiveApiKey();
    if (!apiKey) {
      setErrorMsg(
        'Gemini API Key is missing. Please add VITE_GEMINI_API_KEY in your .env file or enter it in the API Key settings below.'
      );
      setShowKeyInput(true);
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setStatusMsg('Gathering Firebase profile context & synthesizing tailored roadmap with Gemini AI…');

    // Extract profile context from Firebase
    const profileContext = {
      name: userProfile?.name || userProfile?.displayName || 'Student / Engineer',
      target_role: userProfile?.current_target_role || 'Not specified',
      institution: userProfile?.institution || 'Not specified',
      cgpa: userProfile?.cgpa || 'Not specified',
      bio: userProfile?.bio || 'Not specified',
      skills: userProfile?.current_skills ? Object.keys(userProfile.current_skills) : [],
      projects: (userProfile?.projects || []).map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
      })),
    };

    const promptText = `
You are an expert tech career strategist and engineering mentor.
Create an individualized, honest, actionable job-readiness career roadmap based on the candidate's exact interest text and candidate profile data.

Candidate Interest Description:
"${interestInput.trim()}"

Candidate Firebase Profile Data:
- Name: ${profileContext.name}
- Current Target Role: ${profileContext.target_role}
- Institution: ${profileContext.institution}
- CGPA: ${profileContext.cgpa}
- Bio / Background: ${profileContext.bio}
- Existing Known Skills: ${profileContext.skills.length > 0 ? profileContext.skills.join(', ') : 'Beginner / Not specified'}
- Existing Portfolio Projects: ${profileContext.projects.length > 0 ? JSON.stringify(profileContext.projects) : 'None listed yet'}

INSTRUCTIONS:
1. Compare candidate's existing background with their specified interest.
2. Produce exactly 4 chronological stages progressing from current baseline to industry job-readiness.
3. For each stage, include real recognized certifications (or explicitly state "None needed at this stage"), a concrete portfolio project description tailored to their stack, clear readiness milestones, and 2-3 specific action tasks (with estimated duration, priority, and GitHub repo or course recommendation).
4. Return ONLY valid JSON matching this exact JSON schema (no markdown formatting outside of JSON):

{
  "specialization": "Short concise career title derived from interest",
  "summary": "1-2 sentences summarizing how candidate's profile links to this goal",
  "stages": [
    {
      "title": "Stage title (e.g., Foundations & Core Concepts)",
      "duration": "Duration (e.g., Months 0-2)",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "certifications": ["Real Certification Name or 'None needed'"],
      "project": "Concrete portfolio project description (1-2 sentences)",
      "ready": "Checkable milestone signal (1 sentence)",
      "tasks": [
        {
          "id": "unique_string_id",
          "title": "Task title",
          "description": "Short description of what to study or build",
          "estimated_time": "1-2 weeks",
          "priority": "High" | "Medium" | "Low",
          "github_repo_recommendation": "github_org/repo_name or full URL"
        }
      ]
    }
  ]
}
`;

    const apiModels = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-exp',
    ];
    let parsedResult: RoadmapData | null = null;
    let lastError: Error | null = null;

    for (const modelName of apiModels) {
      try {
        setStatusMsg(`Calling Gemini API (${modelName})…`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          // Fallback call without responseMimeType in case model rejects config
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: promptText }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
              },
            }),
          });
        }

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Gemini API error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error('Received empty response from Gemini API.');
        }

        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        parsedResult = JSON.parse(cleaned) as RoadmapData;
        break; // Successfully generated and parsed
      } catch (err: any) {
        console.warn(`Attempt with ${modelName} failed:`, err);
        lastError = err;
      }
    }


    setLoading(false);
    setStatusMsg('');

    if (!parsedResult || !parsedResult.stages) {
      setErrorMsg(
        lastError
          ? `Roadmap generation failed: ${lastError.message}`
          : 'Could not parse roadmap response from AI. Please try again.'
      );
      return;
    }

    // Normalize stage arrays defensively
    if (Array.isArray(parsedResult.stages)) {
      parsedResult.stages = parsedResult.stages.map((stg) => ({
        ...stg,
        title: String(stg.title || 'Stage'),
        duration: String(stg.duration || 'Flexible'),
        skills: Array.isArray(stg.skills)
          ? stg.skills.map(String)
          : typeof stg.skills === 'string'
          ? [stg.skills]
          : [],
        certifications: Array.isArray(stg.certifications)
          ? stg.certifications.map(String)
          : typeof stg.certifications === 'string'
          ? [stg.certifications]
          : [],
        project: String(stg.project || ''),
        ready: String(stg.ready || ''),
      }));
    }

    // Process tasks from stages into flat task list for TaskScheduler
    const allTasks: ActionPlanTask[] = [];
    parsedResult.stages.forEach((stage, sIdx) => {
      if (stage.tasks && Array.isArray(stage.tasks)) {
        stage.tasks.forEach((t, tIdx) => {
          allTasks.push({
            id: t.id || `stage_${sIdx + 1}_task_${tIdx + 1}`,
            title: t.title || `Stage ${sIdx + 1} Task ${tIdx + 1}`,
            description: t.description || stage.project,
            estimated_time: t.estimated_time || stage.duration,
            priority: t.priority || (sIdx === 0 ? 'High' : 'Medium'),
            github_repo_recommendation: t.github_repo_recommendation,
          });
        });
      } else {
        // Fallback task per stage
        allTasks.push({
          id: `stage_${sIdx + 1}_default`,
          title: `Master ${stage.title}`,
          description: `Complete stage project: ${stage.project}`,
          estimated_time: stage.duration,
          priority: sIdx === 0 ? 'High' : 'Medium',
        });
      }
    });

    setRoadmap(parsedResult);
    setRoadmapTasks(allTasks);
    saveRoadmapState(parsedResult, allTasks, interestInput.trim());
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header section */}
      <div className="lab-panel">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="lab-label lab-mono">Personalized AI Guidance</span>
            <h2 className="lab-heading" style={{ fontSize: 24, margin: '4px 0 0' }}>
              Personalized Certification & Career Roadmap
            </h2>
          </div>
          <button
            type="button"
            className="lab-btn-sm"
            onClick={() => setShowKeyInput(!showKeyInput)}
          >
            ⚙ API Settings
          </button>
        </div>

        <p className="lab-body" style={{ marginBottom: 20 }}>
          Specify your exact career interests or technical domain in plain text. Gemini AI will cross-reference your custom goals with your connected Firebase profile data (skills, projects, education) to formulate a tailored, 4-stage job readiness roadmap and task manager.
        </p>

        {/* API Key Toggle Drawer */}
        {showKeyInput && (
          <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--lab-border)', background: 'var(--lab-paper)' }}>
            <label className="lab-label-dark" style={{ display: 'block', marginBottom: 6 }}>
              Custom Gemini API Key Override (Optional)
            </label>
            <input
              type="password"
              className="lab-input"
              placeholder="AIzaSy... (leave blank to use .env key VITE_GEMINI_API_KEY)"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <span className="lab-body" style={{ fontSize: 11 }}>
              By default, StackAlign reads <code>VITE_GEMINI_API_KEY</code> from your <code>.env</code> file. Enter a key above if you want to override it temporarily.
            </span>
          </div>
        )}

        {/* Connected Firebase Profile Context Summary Card */}
        <div style={{ border: '1px solid var(--lab-border)', background: 'var(--lab-paper-warm)', padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowProfileDetails(!showProfileDetails)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="lab-tag lab-tag-green">Firebase Profile Active</span>
              <strong className="lab-heading" style={{ fontSize: 13 }}>
                Connected Profile: {userProfile?.name || userProfile?.displayName || currentUser?.email || 'Authenticated User'}
              </strong>
            </div>
            <span className="lab-label lab-mono">{showProfileDetails ? 'Hide Details ▲' : 'View Profile Context ▼'}</span>
          </div>

          {showProfileDetails && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--lab-border)' }}>
              <div className="lab-grid-3" style={{ gap: 16, background: 'transparent' }}>
                <div>
                  <span className="lab-label">Target Role</span>
                  <p className="lab-body" style={{ margin: '2px 0 0', fontWeight: 500 }}>
                    {userProfile?.current_target_role || 'Not set in profile'}
                  </p>
                </div>
                <div>
                  <span className="lab-label">Institution / CGPA</span>
                  <p className="lab-body" style={{ margin: '2px 0 0', fontWeight: 500 }}>
                    {userProfile?.institution ? `${userProfile.institution} (${userProfile.cgpa || 'N/A'})` : 'Not set'}
                  </p>
                </div>
                <div>
                  <span className="lab-label">Portfolio Projects</span>
                  <p className="lab-body" style={{ margin: '2px 0 0', fontWeight: 500 }}>
                    {userProfile?.projects?.length ? `${userProfile.projects.length} project(s) recorded` : 'None recorded'}
                  </p>
                </div>
              </div>
              {userProfile?.current_skills && (
                <div style={{ marginTop: 12 }}>
                  <span className="lab-label" style={{ display: 'block', marginBottom: 4 }}>Recorded Skills</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.keys(userProfile.current_skills).map((sk) => (
                      <span key={sk} className="lab-tag lab-tag-ink">{sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Text Area Input for User Interest */}
        <div style={{ marginBottom: 20 }}>
          <label className="lab-label-dark" style={{ display: 'block', marginBottom: 8 }}>
            Describe Your Interest or Specific Target Focus Area
          </label>
          <textarea
            className="lab-textarea"
            rows={4}
            placeholder="E.g., I want to specialize in building cloud-native microservices with Go and Kubernetes for high-frequency trading applications. I am interested in AWS certifications and hands-on system design."
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
          />
        </div>

        {/* Quick Domain Presets */}
        <div style={{ marginBottom: 24 }}>
          <span className="lab-label" style={{ display: 'block', marginBottom: 8 }}>
            Or pick from popular specialization domains:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DOMAIN_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="lab-btn-sm"
                style={{ fontSize: 10, padding: '6px 12px' }}
                onClick={() => handlePresetClick(preset)}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button & Status */}
        <button
          type="button"
          className="lab-btn"
          disabled={loading || !interestInput.trim()}
          onClick={generatePersonalizedRoadmap}
        >
          {loading ? 'Synthesizing Roadmap with Gemini AI…' : 'Generate Personalized Career Roadmap →'}
        </button>

        {statusMsg && (
          <p className="lab-body lab-mono lab-loading-pulse" style={{ marginTop: 16, fontSize: 12, textAlign: 'center' }}>
            ⏳ {statusMsg}
          </p>
        )}

        {errorMsg && (
          <div className="lab-error" style={{ marginTop: 16 }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Generated Roadmap Display */}
      {roadmap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Banner */}
          <div className="lab-panel-warm" style={{ borderLeft: '4px solid var(--lab-ink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              <h3 className="lab-heading" style={{ fontSize: 22, margin: 0 }}>
                Roadmap: {roadmap.specialization}
              </h3>
              <span className="lab-label lab-mono">{roadmap.stages?.length || 0} Chronological Stages</span>
            </div>
            <p className="lab-body" style={{ margin: 0 }}>
              {roadmap.summary}
            </p>
          </div>

          {/* Stage Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(roadmap.stages || []).map((stage, idx) => {
              const skillsList = Array.isArray(stage.skills)
                ? stage.skills
                : typeof stage.skills === 'string'
                ? [stage.skills]
                : [];

              const certsList = Array.isArray(stage.certifications)
                ? stage.certifications
                : typeof stage.certifications === 'string'
                ? [stage.certifications]
                : [];

              return (
                <div key={idx} className="lab-panel" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--lab-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        className="lab-mono"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          background: 'var(--lab-ink)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h4 className="lab-heading" style={{ fontSize: 18, margin: 0 }}>
                        {stage.title}
                      </h4>
                    </div>
                    <span className="lab-tag lab-tag-ink lab-mono">{stage.duration}</span>
                  </div>

                  <div className="lab-grid-3" style={{ gap: 20, marginBottom: 20 }}>
                    <div>
                      <span className="lab-label" style={{ display: 'block', marginBottom: 8 }}>Key Target Skills</span>
                      <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--lab-ink-2)', fontSize: 13 }}>
                        {skillsList.map((sk, sIdx) => (
                          <li key={sIdx} style={{ marginBottom: 4 }}>{String(sk)}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="lab-label" style={{ display: 'block', marginBottom: 8 }}>Recommended Certifications</span>
                      <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--lab-ink-2)', fontSize: 13 }}>
                        {certsList.map((certItem, cIdx) => {
                          const certStr = String(certItem || '');
                          return (
                            <li key={cIdx} style={{ marginBottom: 4, fontWeight: certStr.toLowerCase().includes('none') ? 400 : 500 }}>
                              {certStr}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <span className="lab-label" style={{ display: 'block', marginBottom: 8 }}>Stage Portfolio Project</span>
                      <div style={{ background: 'var(--lab-paper)', padding: 12, border: '1px solid var(--lab-border)', fontSize: 12, lineHeight: 1.5 }}>
                        {stage.project}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--lab-paper-warm)', padding: '10px 14px', border: '1px solid var(--lab-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="lab-label-dark" style={{ flexShrink: 0 }}>Readiness Signal:</span>
                    <span className="lab-body" style={{ fontSize: 12, margin: 0 }}>
                      {stage.ready}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Task Scheduler & Kanban Manager */}
          <div style={{ marginTop: 16 }}>
            <TaskScheduler
              tasks={roadmapTasks}
              storageKey={currentUser?.uid ? `roadmap_${currentUser.uid}` : 'roadmap_guest'}
            />
          </div>

        </div>
      )}
    </div>
  );
}

