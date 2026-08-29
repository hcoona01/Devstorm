import { useEffect, useState, type ReactNode } from 'react'
import { ref, update } from 'firebase/database'
import { useAuth } from '../contexts/useAuth'
import { db } from '../firebase'
import {
  normalizePhone,
  optionalUrl,
  submitProfile,
  type Availability,
  type Category,
  type Gender,
  type InstituteType,
  type ProfilePayload,
  type YearOfStudy,
} from '../lib/profileApi'

const PROFILE_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4'
const PROFILE_POSTER =
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60'

const STEPS = ['Identity', 'Academics', 'Availability', 'Portfolio'] as const

const GENDERS: Gender[] = ['Male', 'Female', 'Other', 'Prefer not to say']
const CATEGORIES: Category[] = ['General', 'OBC', 'SC', 'ST', 'EWS']
const INSTITUTE_TYPES: InstituteType[] = [
  'AICTE Affiliated',
  'Non-AICTE',
  'UGC',
  'Other',
]
const YEARS: YearOfStudy[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduated',
]
const AVAILABILITIES: Availability[] = [
  'Immediate',
  'Part-time',
  'Full-time',
  'Specific Months',
]

const fieldClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900'
const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-wide text-neutral-500'

function FadeIn({
  show,
  delay = 0,
  children,
  className = '',
}: {
  show: boolean
  delay?: number
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      } ${className}`}
      style={{ transitionDelay: show ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

export default function ProfileSetup() {
  const { currentUser, pendingProfileSetup, completeProfileSetup } = useAuth()
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [contentIn, setContentIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<Gender>('Prefer not to say')
  const [category, setCategory] = useState<Category>('General')
  const [location, setLocation] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  const [instituteType, setInstituteType] = useState<InstituteType>('AICTE Affiliated')
  const [instituteState, setInstituteState] = useState('')
  const [aisheCode, setAisheCode] = useState('')
  const [institution, setInstitution] = useState('')
  const [degree, setDegree] = useState('')
  const [branch, setBranch] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>('3rd Year')
  const [graduationYear, setGraduationYear] = useState(String(new Date().getFullYear() + 1))
  const [cgpa, setCgpa] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [transcriptUrl, setTranscriptUrl] = useState('')

  const [skillsTags, setSkillsTags] = useState('')
  const [availability, setAvailability] = useState<Availability>('Full-time')
  const [hours, setHours] = useState('20')
  const [projectPreference, setProjectPreference] = useState('')
  const [domainInterest, setDomainInterest] = useState('')
  const [preferredLocations, setPreferredLocations] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [interviewMode, setInterviewMode] = useState('Video')
  const [calendarConsent, setCalendarConsent] = useState(false)

  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [duration, setDuration] = useState('')
  const [expDescription, setExpDescription] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectStack, setProjectStack] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectLink, setProjectLink] = useState('')

  useEffect(() => {
    if (!pendingProfileSetup) {
      setReady(false)
      setContentIn(false)
      setStep(0)
      return
    }

    document.body.style.overflow = 'hidden'
    const a = window.setTimeout(() => setReady(true), 40)
    const b = window.setTimeout(() => setContentIn(true), 280)
    return () => {
      window.clearTimeout(a)
      window.clearTimeout(b)
      document.body.style.overflow = ''
    }
  }, [pendingProfileSetup])

  useEffect(() => {
    if (!pendingProfileSetup) return
    setContentIn(false)
    const t = window.setTimeout(() => setContentIn(true), 80)
    return () => window.clearTimeout(t)
  }, [step, pendingProfileSetup])

  if (!pendingProfileSetup || !currentUser) return null

  const email = currentUser.email || ''

  const csv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

  const validateStep = () => {
    if (step === 0) {
      if (fullName.trim().length < 2) return 'Enter your full name.'
      if (!/^\d{12}$/.test(aadhaar.trim())) return 'Aadhaar must be 12 digits.'
      if (!dob) return 'Date of birth is required.'
      if (!location.trim()) return 'Location is required.'
      const normalized = normalizePhone(phone)
      if (!/^\+?\d{10,15}$/.test(normalized)) return 'Enter a valid phone number.'
    }
    if (step === 1) {
      if (!instituteState.trim() || !aisheCode.trim() || !institution.trim()) {
        return 'Complete all academic institute fields.'
      }
      if (!degree.trim() || !branch.trim() || !rollNumber.trim()) {
        return 'Degree, branch, and roll number are required.'
      }
      const year = Number(graduationYear)
      const score = Number(cgpa)
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        return 'Graduation year must be between 2000 and 2100.'
      }
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        return 'CGPA / percentage must be between 0 and 100.'
      }
    }
    if (step === 2) {
      if (!skillsTags.trim()) return 'Add at least one skill tag.'
      if (!projectPreference.trim() || !domainInterest.trim()) {
        return 'Project preference and domain interest are required.'
      }
      if (!preferredLocations.trim()) return 'Add at least one preferred location.'
      const weekly = Number(hours)
      if (!Number.isFinite(weekly) || weekly < 0 || weekly > 168) {
        return 'Hours per week must be between 0 and 168.'
      }
      if (!timezone.trim() || !interviewMode.trim()) {
        return 'Timezone and interview mode are required.'
      }
    }
    return ''
  }

  const buildPayload = (): ProfilePayload => {
    const skills = csv(skillsTags)
    const payload: ProfilePayload = {
      identity: {
        full_name: fullName.trim(),
        email,
        phone: normalizePhone(phone),
        aadhaar_number: aadhaar.trim(),
        dob,
        gender,
        category,
        location: location.trim(),
        photo_url: optionalUrl(photoUrl),
      },
      academic: {
        institute_type: instituteType,
        institute_state: instituteState.trim(),
        aishe_code: aisheCode.trim(),
        institution: institution.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        year_of_study: yearOfStudy,
        graduation_year: Number(graduationYear),
        cgpa: Number(cgpa),
        transcript_url: optionalUrl(transcriptUrl),
        roll_number: rollNumber.trim(),
      },
      work_experience: [],
      education_history: [],
      skills: skills.map((name) => ({ name, category: 'General' })),
      certifications: [],
      projects: [],
      project_data: {
        skills_tags: skills,
        availability,
        availability_hours_per_week: Number(hours),
        project_preference: projectPreference.trim(),
        domain_interest: domainInterest.trim(),
        preferred_locations: csv(preferredLocations),
      },
      scheduling: {
        timezone: timezone.trim(),
        preferred_interview_mode: interviewMode.trim(),
        calendar_integration_consent: calendarConsent,
      },
      linkedin_url: optionalUrl(linkedinUrl),
      resume_url: optionalUrl(resumeUrl),
    }

    if (company.trim() && role.trim() && duration.trim()) {
      payload.work_experience.push({
        company: company.trim(),
        role: role.trim(),
        duration: duration.trim(),
        description: csv(expDescription).length
          ? csv(expDescription)
          : ['Experience added during profile setup.'],
      })
    }

    if (projectTitle.trim() && projectDesc.trim()) {
      payload.projects.push({
        title: projectTitle.trim(),
        tech_stack: csv(projectStack).length ? csv(projectStack) : ['General'],
        description: projectDesc.trim(),
        link: optionalUrl(projectLink),
      })
    }

    return payload
  }

  const goNext = () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep((value) => Math.min(value + 1, STEPS.length - 1))
  }

  const handleSubmit = async () => {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }

    try {
      setLoading(true)
      setError('')
      const token = await currentUser.getIdToken()
      const payload = buildPayload()
      await update(ref(db, `users/${currentUser.uid}`), {
        displayName: fullName.trim(),
        profileComplete: true,
        profileData: JSON.parse(JSON.stringify(payload)),
      })
      await submitProfile(token, payload)
      completeProfileSetup()
    } catch (err) {
      const text =
        err instanceof Error ? err.message : 'Could not submit profile.'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[60] min-h-screen w-full bg-[#ededed] p-3 font-[Inter,system-ui,sans-serif] sm:p-4 transition-opacity duration-700 ${
        ready ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative h-[calc(100vh-24px)] w-full overflow-hidden rounded-2xl bg-[#d9d9d9] sm:h-[calc(100vh-32px)] sm:rounded-3xl">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          poster={PROFILE_POSTER}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          ref={(el) => {
            el?.setAttribute('webkit-playsinline', 'true')
            el?.setAttribute('x5-playsinline', 'true')
          }}
        >
          <source src="/profile-bg.mp4" type="video/mp4" />
          <source src={PROFILE_VIDEO} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/10" />

        <div className="relative z-10 flex h-full items-center justify-center px-4 py-6 sm:px-8">
          <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_20px_80px_rgba(0,0,0,0.12)] backdrop-blur-md">
            <FadeIn show={contentIn} delay={0} className="border-b border-neutral-200/80 px-6 py-5 sm:px-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className="mt-1 text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
                Finish your profile
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {STEPS[step]} — this appears only after a new sign up.
              </p>
              <div className="mt-4 flex gap-1.5">
                {STEPS.map((label, index) => (
                  <div
                    key={label}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                      index <= step ? 'bg-[#ef4d23]' : 'bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
            </FadeIn>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
              {error && (
                <FadeIn show={contentIn} delay={40}>
                  <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                </FadeIn>
              )}

              {step === 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FadeIn show={contentIn} delay={80} className="sm:col-span-2">
                    <label className={labelClass}>Full name</label>
                    <input className={fieldClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={140} className="sm:col-span-2">
                    <label className={labelClass}>Email</label>
                    <input className={`${fieldClass} bg-neutral-50`} value={email} readOnly />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={200}>
                    <label className={labelClass}>Phone</label>
                    <input className={fieldClass} placeholder="+91xxxxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={260}>
                    <label className={labelClass}>Aadhaar (12 digits)</label>
                    <input className={fieldClass} inputMode="numeric" maxLength={12} value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={320}>
                    <label className={labelClass}>Date of birth</label>
                    <input type="date" className={fieldClass} value={dob} onChange={(e) => setDob(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={380}>
                    <label className={labelClass}>Location</label>
                    <input className={fieldClass} placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={440}>
                    <label className={labelClass}>Gender</label>
                    <select className={fieldClass} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                      {GENDERS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </FadeIn>
                  <FadeIn show={contentIn} delay={500}>
                    <label className={labelClass}>Category</label>
                    <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                      {CATEGORIES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </FadeIn>
                  <FadeIn show={contentIn} delay={560} className="sm:col-span-2">
                    <label className={labelClass}>Photo URL (optional)</label>
                    <input className={fieldClass} placeholder="https://..." value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                  </FadeIn>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FadeIn show={contentIn} delay={80}>
                    <label className={labelClass}>Institute type</label>
                    <select className={fieldClass} value={instituteType} onChange={(e) => setInstituteType(e.target.value as InstituteType)}>
                      {INSTITUTE_TYPES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </FadeIn>
                  <FadeIn show={contentIn} delay={140}>
                    <label className={labelClass}>Institute state</label>
                    <input className={fieldClass} value={instituteState} onChange={(e) => setInstituteState(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={200}>
                    <label className={labelClass}>AISHE code</label>
                    <input className={fieldClass} value={aisheCode} onChange={(e) => setAisheCode(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={260}>
                    <label className={labelClass}>Institution</label>
                    <input className={fieldClass} value={institution} onChange={(e) => setInstitution(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={320}>
                    <label className={labelClass}>Degree</label>
                    <input className={fieldClass} value={degree} onChange={(e) => setDegree(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={380}>
                    <label className={labelClass}>Branch</label>
                    <input className={fieldClass} value={branch} onChange={(e) => setBranch(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={440}>
                    <label className={labelClass}>Year of study</label>
                    <select className={fieldClass} value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value as YearOfStudy)}>
                      {YEARS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </FadeIn>
                  <FadeIn show={contentIn} delay={500}>
                    <label className={labelClass}>Graduation year</label>
                    <input className={fieldClass} inputMode="numeric" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={560}>
                    <label className={labelClass}>CGPA / %</label>
                    <input className={fieldClass} inputMode="decimal" value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={620}>
                    <label className={labelClass}>Roll number</label>
                    <input className={fieldClass} value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={680} className="sm:col-span-2">
                    <label className={labelClass}>Transcript URL (optional)</label>
                    <input className={fieldClass} placeholder="https://..." value={transcriptUrl} onChange={(e) => setTranscriptUrl(e.target.value)} />
                  </FadeIn>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FadeIn show={contentIn} delay={80} className="sm:col-span-2">
                    <label className={labelClass}>Skill tags (comma separated)</label>
                    <input className={fieldClass} placeholder="React, FastAPI, SQL" value={skillsTags} onChange={(e) => setSkillsTags(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={140}>
                    <label className={labelClass}>Availability</label>
                    <select className={fieldClass} value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
                      {AVAILABILITIES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </FadeIn>
                  <FadeIn show={contentIn} delay={200}>
                    <label className={labelClass}>Hours / week</label>
                    <input className={fieldClass} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={260}>
                    <label className={labelClass}>Project preference</label>
                    <input className={fieldClass} value={projectPreference} onChange={(e) => setProjectPreference(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={320}>
                    <label className={labelClass}>Domain interest</label>
                    <input className={fieldClass} value={domainInterest} onChange={(e) => setDomainInterest(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={380} className="sm:col-span-2">
                    <label className={labelClass}>Preferred locations (comma separated)</label>
                    <input className={fieldClass} placeholder="Remote, Bengaluru" value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={440}>
                    <label className={labelClass}>Timezone</label>
                    <input className={fieldClass} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={500}>
                    <label className={labelClass}>Interview mode</label>
                    <input className={fieldClass} value={interviewMode} onChange={(e) => setInterviewMode(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={560} className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                      <input
                        type="checkbox"
                        checked={calendarConsent}
                        onChange={(e) => setCalendarConsent(e.target.checked)}
                      />
                      Allow calendar integration for interviews
                    </label>
                  </FadeIn>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FadeIn show={contentIn} delay={80} className="sm:col-span-2">
                    <label className={labelClass}>LinkedIn URL (optional)</label>
                    <input className={fieldClass} placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={140} className="sm:col-span-2">
                    <label className={labelClass}>Resume URL (optional)</label>
                    <input className={fieldClass} placeholder="https://..." value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={200}>
                    <label className={labelClass}>Experience company</label>
                    <input className={fieldClass} value={company} onChange={(e) => setCompany(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={260}>
                    <label className={labelClass}>Experience role</label>
                    <input className={fieldClass} value={role} onChange={(e) => setRole(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={320}>
                    <label className={labelClass}>Duration</label>
                    <input className={fieldClass} placeholder="Jun 2024 – Present" value={duration} onChange={(e) => setDuration(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={380}>
                    <label className={labelClass}>Experience notes</label>
                    <input className={fieldClass} placeholder="Comma separated bullets" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={440}>
                    <label className={labelClass}>Project title</label>
                    <input className={fieldClass} value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={500}>
                    <label className={labelClass}>Tech stack</label>
                    <input className={fieldClass} placeholder="React, FastAPI" value={projectStack} onChange={(e) => setProjectStack(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={560} className="sm:col-span-2">
                    <label className={labelClass}>Project description</label>
                    <textarea className={`${fieldClass} min-h-[88px] resize-y`} value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
                  </FadeIn>
                  <FadeIn show={contentIn} delay={620} className="sm:col-span-2">
                    <label className={labelClass}>Project link (optional)</label>
                    <input className={fieldClass} placeholder="https://..." value={projectLink} onChange={(e) => setProjectLink(e.target.value)} />
                  </FadeIn>
                </div>
              )}
            </div>

            <FadeIn show={contentIn} delay={120} className="flex items-center justify-between gap-3 border-t border-neutral-200/80 px-6 py-4 sm:px-8">
              <button
                type="button"
                disabled={step === 0 || loading}
                onClick={() => {
                  setError('')
                  setStep((value) => Math.max(0, value - 1))
                }}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40"
              >
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-full bg-[#0b0f1a] px-5 py-2 text-sm font-medium text-white transition hover:bg-black"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void handleSubmit()}
                  className="rounded-full bg-[#ef4d23] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Submitting…' : 'Create profile'}
                </button>
              )}
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  )
}
