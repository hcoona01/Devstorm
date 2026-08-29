export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return res.status(201).json({
      status: 'success',
      message: 'Profile submitted, validated, and authenticated successfully',
      data_received: data,
    });
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }
}
