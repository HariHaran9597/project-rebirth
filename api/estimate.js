// Optional meal estimate via Gemini. Turned on only when these Vercel environment variables are set:
//   GEMINI_API_KEY      (from Google AI Studio)
//   SUPABASE_URL        (same Project URL as config.js)
//   SUPABASE_ANON_KEY   (same public key as config.js)
//   GEMINI_MODEL        (optional, defaults to gemini-2.5-flash)
// Requests must carry the signed-in user's Supabase token, so nobody else can spend your key.

module.exports = async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (req.method === 'GET') return res.status(200).json({ enabled: Boolean(key && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!key) return res.status(501).json({ error: 'not_configured' });

  const supaUrl = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!supaUrl || !anon) return res.status(500).json({ error: 'server_not_configured' });

  const auth = req.headers.authorization || '';
  try {
    const who = await fetch(supaUrl.replace(/\/$/, '') + '/auth/v1/user', { headers: { Authorization: auth, apikey: anon } });
    if (!who.ok) return res.status(401).json({ error: 'unauthorized' });
  } catch (e) {
    return res.status(502).json({ error: 'auth_check_failed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch { body = {}; } }
  const text = String((body && body.text) || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'empty' });

  const prompt = `You estimate nutrition for meals eaten in Bangalore, India: home cooking and Swiggy or Zomato restaurant portions. Split the meal into separate items. For each item give a short name including the portion, protein in grams, and calories. Be realistic about restaurant oil and portion sizes. Reply with only a JSON array, for example [{"n":"Chicken biryani, 1 plate","p":30,"k":750}]. Meal: ${text}`;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  try {
    const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    if (!g.ok) return res.status(502).json({ error: 'model_error', status: g.status });
    const j = await g.json();
    const out = (((j.candidates || [])[0] || {}).content || {}).parts?.map(p => p.text || '').join('') || '[]';
    let items;
    try { items = JSON.parse(out); } catch { const m = out.match(/\[[\s\S]*\]/); items = m ? JSON.parse(m[0]) : []; }
    if (!Array.isArray(items)) items = items && Array.isArray(items.items) ? items.items : [];
    items = items.filter(x => x && x.n).slice(0, 12).map(x => ({ n: String(x.n).slice(0, 80), p: Math.round((+x.p || 0) * 10) / 10, k: Math.round(+x.k || 0) }));
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(502).json({ error: 'model_error' });
  }
};
