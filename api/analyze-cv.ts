export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  return res.status(200).json({
    match_score: 78,
    missing_keywords: ['Kubernetes', 'GraphQL', 'Agile Methodologies'],
    scraped_insights: [
      "Found 'FastAPI' extensively used in your GitHub repositories.",
      'LinkedIn indicates 2 years of React experience, matching the JD requirements.',
      "Trending jobs in this sector frequently demand 'Docker' which is missing from your profile.",
    ],
    improvement_points: [
      {
        category: 'Action Verbs',
        suggestion: 'Use stronger action verbs to describe your backend achievements.',
        original_text: 'Worked on the API for the main application.',
        improved_text:
          'Architected and deployed a highly scalable FastAPI service handling 10k+ requests/sec.',
      },
      {
        category: 'Keyword Optimization',
        suggestion:
          'The JD emphasizes GraphQL. Since your GitHub shows GraphQL projects, explicitly add it to your skills section.',
        original_text: null,
        improved_text: null,
      },
    ],
  });
}
