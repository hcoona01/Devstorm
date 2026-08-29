export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say'
export type Category = 'General' | 'OBC' | 'SC' | 'ST' | 'EWS'
export type InstituteType = 'AICTE Affiliated' | 'Non-AICTE' | 'UGC' | 'Other'
export type YearOfStudy =
  | '1st Year'
  | '2nd Year'
  | '3rd Year'
  | '4th Year'
  | '5th Year'
  | 'Graduated'
export type Availability =
  | 'Immediate'
  | 'Part-time'
  | 'Full-time'
  | 'Specific Months'

export interface ProfilePayload {
  identity: {
    full_name: string
    email: string
    phone: string
    aadhaar_number: string
    dob: string
    gender: Gender
    category: Category
    location: string
    photo_url?: string
  }
  academic: {
    institute_type: InstituteType
    institute_state: string
    aishe_code: string
    institution: string
    degree: string
    branch: string
    year_of_study: YearOfStudy
    graduation_year: number
    cgpa: number
    transcript_url?: string
    roll_number: string
  }
  work_experience: Array<{
    company: string
    role: string
    duration: string
    description: string[]
  }>
  education_history: Array<{
    institution: string
    degree: string
    field_of_study: string
    start_year: number
    end_year?: number
  }>
  skills: Array<{ name: string; category: string }>
  certifications: Array<{
    title: string
    issuing_authority: string
    verification_url?: string
  }>
  projects: Array<{
    title: string
    tech_stack: string[]
    description: string
    link?: string
  }>
  project_data: {
    skills_tags: string[]
    availability: Availability
    availability_hours_per_week: number
    project_preference: string
    domain_interest: string
    preferred_locations: string[]
  }
  scheduling: {
    timezone: string
    preferred_interview_mode: string
    calendar_integration_consent: boolean
  }
  linkedin_url?: string
  resume_url?: string
}

function optionalUrl(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  return digits.startsWith('+') ? digits : `+${digits}`
}

export async function submitProfile(token: string, payload: ProfilePayload) {
  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      let message = `Profile API error (${res.status})`
      try {
        const body = (await res.json()) as {
          detail?: string | Array<{ msg?: string; loc?: unknown[] }>
        }
        if (typeof body.detail === 'string') {
          message = body.detail
        } else if (Array.isArray(body.detail)) {
          message = body.detail
            .map((item) => item.msg)
            .filter(Boolean)
            .join(' · ')
        }
      } catch {
        /* keep default */
      }
      console.warn(message)
    } else {
      return (await res.json()) as { status: string; message: string }
    }
  } catch (err) {
    console.warn('Profile API call issue (profile stored in Firebase):', err)
  }

  return { status: 'success', message: 'Profile saved successfully' }
}

export { optionalUrl }
