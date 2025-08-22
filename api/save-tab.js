import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers?.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-extension-secret');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const extensionSecretHeader = req.headers['x-extension-secret'];
    const requiredSecret = process.env.EXTENSION_SECRET;
    if (requiredSecret && extensionSecretHeader !== requiredSecret) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { userId: bodyUserId, userEmail, url, title, category, description, favicon, created_at } = req.body || {};
    if (!url || !title || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase server credentials not configured' });
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve user id
    let resolvedUserId = bodyUserId;
    if (!resolvedUserId && userEmail) {
      const { data: userByEmail, error: adminErr } = await supabase.auth.admin.getUserByEmail(userEmail);
      if (adminErr) {
        res.status(500).json({ error: adminErr.message });
        return;
      }
      resolvedUserId = userByEmail?.user?.id;
    }

    if (!resolvedUserId) {
      res.status(400).json({ error: 'Missing userId or userEmail' });
      return;
    }

    const { error } = await supabase.from('websites').insert({
      url,
      title,
      category,
      description: description || null,
      favicon: favicon || null,
      user_id: resolvedUserId,
      created_at: created_at || new Date().toISOString(),
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('save-tab error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


