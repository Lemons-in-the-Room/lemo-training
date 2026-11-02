/* global process */
// POST /api/translate — traduce testi della piattaforma dall'italiano (solo admin).
// Body: { items: [{ key, it }], targets: ['en','es'] }  ->  { en: { key: testo }, es: { key: testo } }
// Il salvataggio nel database lo fa la dashboard (permessi admin via RLS): qui nessuna scrittura.
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const NAMES = { en: 'English', es: 'Spanish (Spain)' };
const MAX_ITEMS = 60;

const PROMPT = (target, items) => `
You translate the user interface and training content of "Lemons in the Room", a training platform for hospital staff (nurses, doctors, healthcare operators) who use Meta Quest VR headsets with patients.
Translate each Italian text into ${NAMES[target]}.

Rules:
- Natural, clear, professional tone, the same register as the Italian (informal "tu" in Italian -> informal in Spanish "tú"; plain direct English).
- Keep EXACTLY unchanged: placeholders in curly braces like {n} {m} {name}, markdown (**bold**), line breaks, emoji, numbers, URLs, e-mail addresses.
- Never translate these names: Lemons in the Room, Lemons, LEMO, Lemo Jr, Rabbits, Telly, Meta Quest, Quest, Wi-Fi.
- Glossary IT -> EN / ES: visore -> headset / visor; teca -> display case / vitrina; basetta di ricarica -> charging dock / base de carga; sanificazione -> sanitisation / higienización; tappa -> stage / etapa; verifica finale -> final test / prueba final; reparto -> ward / servicio; operatore -> operator / operador.
- Short UI labels (buttons, menu items) must stay short.
- The "key" only gives context (where the text appears); do not translate it.

Return ONLY a JSON object mapping each key to its translation.

Texts:
${JSON.stringify(Object.fromEntries(items.map((i) => [i.key, i.it])), null, 1)}
`.trim();

async function translate(target, items) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: PROMPT(target, items) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '{}';
  const out = JSON.parse(text);
  const res = {};
  for (const { key } of items) if (typeof out[key] === 'string') res[key] = out[key];
  return res;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Login richiesto' });

  const db = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: isAdmin, error } = await db.rpc('is_admin');
  if (error || isAdmin !== true) return res.status(403).json({ error: 'Solo per gli amministratori' });
  if (!GEMINI_KEY) return res.status(503).json({ error: 'Manca GEMINI_API_KEY' });

  const { items = [], targets = ['en', 'es'] } = req.body || {};
  const list = (Array.isArray(items) ? items : [])
    .filter((i) => i && typeof i.key === 'string' && typeof i.it === 'string' && i.it.trim())
    .slice(0, MAX_ITEMS)
    .map((i) => ({ key: i.key.slice(0, 200), it: i.it.slice(0, 4000) }));
  if (!list.length) return res.status(400).json({ error: 'Niente da tradurre' });

  try {
    const langs = targets.filter((l) => NAMES[l]);
    const results = await Promise.all(langs.map((l) => translate(l, list)));
    return res.status(200).json(Object.fromEntries(langs.map((l, k) => [l, results[k]])));
  } catch (e) {
    return res.status(502).json({ error: 'Traduzione non riuscita', detail: e.message });
  }
}
