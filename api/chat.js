/* global process */
// POST /api/chat — chatbot di supporto Lemons.
// - Solo utenti loggati (token Supabase nell'header Authorization).
// - Legge il pacchetto conoscenza aggiornato (moduli + FAQ + base di conoscenza admin).
// - Risponde con Gemini nella lingua dell'utente; registra la domanda in chat_logs.
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';
import { getKnowledge } from './_knowledge.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const LIMIT_PER_HOUR = Number(process.env.CHAT_LIMIT_PER_HOUR || 30);
const MAX_QUESTION = 1000;

const LANG_NAMES = { it: 'italiano', en: 'English', es: 'español' };

const SYSTEM = (knowledge, langName, profile) => `
Sei l'assistente di supporto di Lemons in the Room per gli operatori sanitari che usano i visori VR LEMO in ospedale.
Rispondi nella STESSA lingua in cui l'utente scrive la domanda (qualsiasi lingua), anche se le fonti sono in italiano. Solo se la lingua della domanda non è chiara, rispondi in ${langName}.

REGOLE
1. Usa SOLO le informazioni nella CONOSCENZA qui sotto. Se la risposta non c'è, dillo chiaramente, imposta "answered": false e suggerisci di aprire un ticket dalla pagina Supporto. Non inventare procedure, numeri, tempi o impostazioni.
2. Se moduli e "BASE DI CONOSCENZA DEL TEAM" sono in conflitto, vale la voce più recente della base di conoscenza.
3. Niente consigli clinici o medici (diagnosi, indicazioni, controindicazioni sul paziente): per questi rimanda al medico/personale sanitario responsabile.
4. Se l'utente scrive dati di un paziente, non riportarli e ricordagli di non inserirli.
5. Risposte brevi e operative: passi numerati quando serve, max ~120 parole.
6. In "sources" elenca i titoli delle fonti usate (es. "Modulo Sanificazione", "FAQ: Il visore non si ricarica", "KB: Wi-Fi Careggi").
${profile ? `L'operatore segue il percorso formativo: ${profile}.` : ''}

CONOSCENZA
${knowledge}
`.trim();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Login richiesto' });

  const db = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Sessione non valida' });
  const userId = userData.user.id;

  const { question, lang = 'it', history = [] } = req.body || {};
  const q = String(question || '').trim();
  if (!q) return res.status(400).json({ error: 'Domanda vuota' });
  if (q.length > MAX_QUESTION) return res.status(400).json({ error: 'Domanda troppo lunga' });

  // Limite messaggi per utente
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from('chat_logs').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', since);
  if ((count || 0) >= LIMIT_PER_HOUR) {
    return res.status(429).json({ error: 'Hai raggiunto il limite di messaggi per quest\'ora. Riprova più tardi o apri un ticket.' });
  }

  if (!GEMINI_KEY) return res.status(503).json({ error: 'Chatbot non ancora configurato (manca GEMINI_API_KEY).' });

  let knowledge;
  try { knowledge = await getKnowledge(db); }
  catch (e) { return res.status(500).json({ error: 'Errore lettura conoscenza', detail: e.message }); }

  const { data: profileRow } = await db.from('users').select('patient_type').eq('id', userId).maybeSingle();
  const langName = LANG_NAMES[lang] || lang;

  const contents = [
    ...(Array.isArray(history) ? history.slice(-6) : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.text)
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.text).slice(0, 1500) }] })),
    { role: 'user', parts: [{ text: q }] },
  ];

  let out;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM(knowledge, langName, profileRow?.patient_type) }] },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              answer: { type: 'STRING' },
              sources: { type: 'ARRAY', items: { type: 'STRING' } },
              answered: { type: 'BOOLEAN' },
            },
            required: ['answer', 'sources', 'answered'],
          },
        },
      }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);
    const text = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    out = JSON.parse(text);
  } catch (e) {
    return res.status(502).json({ error: 'Il servizio AI non ha risposto. Riprova tra poco.', detail: e.message });
  }

  const answer = String(out.answer || '').trim();
  const sources = Array.isArray(out.sources)
    ? [...new Set(out.sources.map(x => String(x).replace(/\s*\((aggiornato|rif\.)[^)]*\)/gi, '').replace(/\s*\[[^\]]*\]/g, '').trim()))].filter(Boolean).slice(0, 6)
    : [];
  const answered = out.answered !== false;

  await db.from('chat_logs').insert({ user_id: userId, lang, question: q, answer, sources, answered });

  return res.status(200).json({ answer, sources, answered });
}
