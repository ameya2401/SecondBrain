import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase server credentials not configured' });
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve userId from email if provided
    let userId = req.query.userId;
    const email = req.query.email;
    if (!userId && email) {
      const { data, error } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', String(email))
        .limit(1)
        .maybeSingle();
      if (error) {
        res.status(500).json({ error: `User lookup failed: ${error.message}` });
        return;
      }
      userId = data?.id;
    }

    if (!userId) {
      res.status(400).json({ error: 'Missing userId or email' });
      return;
    }

    const { data, error } = await supabase
      .from('websites')
      .select('category')
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const unique = Array.from(new Set((data || []).map((r) => r.category))).sort();
    res.status(200).json({ categories: unique });
  } catch (err) {
    console.error('categories error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


