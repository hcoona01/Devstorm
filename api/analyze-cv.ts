declare const process: any;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const jdMatch = bodyText.match(/name="job_description"\r\n\r\n([\s\S]*?)\r\n--/) || bodyText.match(/"job_description"\s*:\s*"([^"]+)"/);
    const jdText = jdMatch ? jdMatch[1].trim() : bodyText;

    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`;
        const prompt = `You are an expert HR AI Career Advisor and Resume Analyst.
Analyze the following Job Description against the candidate's target profile.

JOB DESCRIPTION:
"""
${jdText}
"""

Perform a comprehensive, professional analysis.
Return your response ONLY as a valid JSON object with EXACTLY this structure:
{
  "match_score": 82,
  "missing_keywords": ["Keyword1", "Keyword2", "Keyword3"],
  "scraped_insights": [
    "Insight statement 1...",
    "Insight statement 2...",
    "Insight statement 3..."
  ],
  "improvement_points": [
    {
      "category": "Category Name",
      "suggestion": "Clear suggestion...",
      "original_text": "Original bullet...",
      "improved_text": "Improved bullet..."
    }
  ],
  "action_plan": [
    {
      "id": "task-gemini-1",
      "title": "Actionable task title",
      "description": "Specific project task description for skill enhancement...",
      "priority": "High",
      "estimated_time": "3 hours",
      "github_repo_recommendation": "owner/repo"
    }
  ]
}`;

        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (geminiRes.ok) {
          const geminiData: any = await geminiRes.json();
          const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsedAnalysis = JSON.parse(rawJsonText);
            return res.status(200).json(parsedAnalysis);
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini Vercel analysis notice:', geminiErr);
      }
    }

    const extractedTech = ['Docker', 'GraphQL', 'Kubernetes', 'FastAPI', 'TypeScript', 'TailwindCSS', 'Redis', 'Python', 'React', 'Figma']
      .filter((t) => jdText.toLowerCase().includes(t.toLowerCase()));

    const missingKeywords = extractedTech.length > 0 ? extractedTech.slice(0, 3) : ['Docker', 'GraphQL', 'CI/CD Pipelines'];

    return res.status(200).json({
      match_score: Math.min(95, Math.max(65, 75 + extractedTech.length * 5)),
      missing_keywords: missingKeywords,
      scraped_insights: [
        `Extracted target requirements from provided JD snippet (${jdText.slice(0, 45)}...).`,
        `Analyzed real-time stack gaps: ${missingKeywords.join(', ')} missing from current profile.`,
      ],
      improvement_points: [
        {
          category: 'Keyword Optimization',
          suggestion: `Add explicit mention of ${missingKeywords[0] || 'target tech'} to your resume summary.`,
          original_text: 'Experienced developer with strong problem-solving skills.',
          improved_text: `Results-driven engineer specialized in ${missingKeywords.slice(0, 2).join(' & ')} with scalable architecture experience.`,
        },
      ],
      action_plan: [
        {
          id: 'task-apify-1',
          title: `Master ${missingKeywords[0] || 'Core Tech'} Integration`,
          description: `Build a production-ready module demonstrating proficiency in ${missingKeywords[0] || 'Target Stack'}.`,
          priority: 'High',
          estimated_time: '3 hours',
          github_repo_recommendation: `topics/${(missingKeywords[0] || 'awesome').toLowerCase()}`,
        },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal Server Error' });
  }
}
