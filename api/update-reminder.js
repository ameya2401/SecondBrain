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

    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Missing JSON body' });
      return;
    }

    const { websiteId, userId, action } = req.body;
    if (!websiteId || !userId || !action) {
      res.status(400).json({ error: 'Missing required fields (websiteId, userId, action)' });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: 'Supabase configuration missing' });
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let updateData = {};
    
    switch (action) {
      case 'check_later':
        updateData = {
          last_reminded_at: new Date().toISOString()
        };
        break;
      case 'dismiss':
        updateData = {
          reminder_dismissed: true,
          last_reminded_at: new Date().toISOString()
        };
        break;
      case 'reset':
        updateData = {
          reminder_dismissed: false,
          last_reminded_at: null
        };
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Use: check_later, dismiss, or reset' });
        return;
    }

    const { error } = await supabase
      .from('websites')
      .update(updateData)
      .eq('id', websiteId)
      .eq('user_id', userId);

    if (error) {
      res.status(500).json({ error: `Supabase update failed: ${error.message}` });
      return;
    }

    res.status(200).json({ success: true, action });
  } catch (err) {
    console.error('update-reminder error:', err);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}