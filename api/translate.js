/* global process */
// POST /api/translate — traduce testi della piattaforma dall'italiano (solo admin).
// Body: { items: [{ key, it }], targets: ['en','es'] }  ->  { en: { key: testo }, es: { key: testo } }
// Il salvataggio nel database lo fa la dashboard (permessi admin via RLS): qui nessuna scrittura.
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';
import { CLAUDE_KEY, claudeTool } from './_claude.js';

const TRANSLATE_MODEL = process.env.TRANSLATE_MODEL || 'claude-sonnet-5-5';
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

Return one translation for every key, using the tool.

Texts:
${JSON.stringify(Object.fromEntries(items.map((i) => [i.key, i.it])), null, 1)}
`.trim();

async function translate(target, items) {
  const out = await claudeTool({
    model: TRANSLATE_MODEL,
    messages: [{ role: 'user', content: PROMPT(target, items) }],
    schema: {
      type: 'object',
      properties: { translations: { type: 'array', items: { type: 'object', properties: { key: { type: 'string' }, text: { type: 'string' } }, required: ['key', 'text'] } } },
      required: ['translations'],
    },
    name: 'traduzioni',
    description: 'Restituisci una traduzione per ogni chiave ricevuta.',
    maxTokens: 8000,
  });
  const res = {};
  const wanted = new Set(items.map((i) => i.key));
  for (const { key, text } of out.translations || []) if (wanted.has(key) && typeof text === 'string') res[key] = text;
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
  if (!CLAUDE_KEY) return res.status(503).json({ error: 'Manca ANTHROPIC_API_KEY' });

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
