import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Allow simple navigations
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
    const { url, title, category, email, secret } = req.query || {};

    const requiredSecret = process.env.EXTENSION_SECRET;
    if (requiredSecret && secret !== requiredSecret) {
      respondHtml(res, 401, 'Unauthorized');
      return;
    }

    if (!url) {
      respondHtml(res, 400, 'Missing url');
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!supabaseUrl || !serviceKey) {
      respondHtml(res, 500, 'Server not configured');
      return;
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve user id
    let resolvedUserId = undefined;
    if (email) {
      const { data: userByEmail, error: adminErr } = await supabase.auth.admin.getUserByEmail(String(email));
      if (adminErr) {
        respondHtml(res, 500, 'User lookup failed');
        return;
      }
      resolvedUserId = userByEmail?.user?.id;
    }

    if (!resolvedUserId) {
      respondHtml(res, 400, 'Missing or unknown email');
      return;
    }

    const safeUrl = String(url);
    const safeTitle = (title ? String(title) : safeUrl).slice(0, 500);
    const safeCategory = (category ? String(category) : 'Uncategorized').slice(0, 100);

    const { error } = await supabase.from('websites').insert({
      url: safeUrl,
      title: safeTitle,
      category: safeCategory,
      description: null,
      favicon: null,
      user_id: resolvedUserId,
      created_at: new Date().toISOString(),
    });

    if (error) {
      respondHtml(res, 500, 'Save failed');
      return;
    }

    respondHtml(res, 200, 'Saved to SecondBrain. You can close this tab.');
  } catch (err) {
    respondHtml(res, 500, 'Internal Server Error');
  }
}

function respondHtml(res, status, message) {
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').end(`<!doctype html><html><body style="font-family:system-ui;padding:16px;">${message}<script>setTimeout(()=>window.close(),1000);</script></body></html>`);
}


