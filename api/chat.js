/* global process */
// POST /api/chat — chatbot di supporto Lemons.
// - Solo utenti loggati (token Supabase nell'header Authorization).
// - Legge il pacchetto conoscenza aggiornato (moduli + FAQ + base di conoscenza admin).
// - Risponde con Claude (Haiku) nella lingua dell'utente; registra la domanda in chat_logs.
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';
import { getKnowledge } from './_knowledge.js';
import { CLAUDE_KEY, claudeTool } from './_claude.js';

const CHAT_MODEL = process.env.CHAT_MODEL || 'claude-haiku-5-5';
const LIMIT_PER_HOUR = Number(process.env.CHAT_LIMIT_PER_HOUR || 30);
const MAX_QUESTION = 1000;

const LANG_NAMES = { it: 'italiano', en: 'English', es: 'español' };

const RULES = (langName, profile) => `
Sei l'assistente di supporto di Lemons in the Room per gli operatori sanitari che usano i visori VR LEMO in ospedale. Dai del tu.
LINGUA (regola più importante): rispondi SEMPRE nella lingua in cui è scritta l'ULTIMA domanda dell'utente, qualunque sia. Le fonti sono in italiano: se la domanda è in inglese o spagnolo, traduci tu il contenuto. Esempio: "How much does a headset cost?" → risposta interamente in inglese.
Glossario IT → EN / ES (usa solo questi termini, senza aggiungere sinonimi tra parentesi): visore → headset / visor; cinturino → strap / correa; basetta di ricarica → charging dock / base de carga; teca → display case / vitrina; sanificazione → sanitisation / higienización; tappa → stage / etapa; verifica finale → final test / prueba final; reparto → ward / servicio; operatore → operator / operador. Solo se la lingua della domanda non è chiara, rispondi in ${langName}.

REGOLE
1. Usa SOLO le informazioni nella CONOSCENZA (sopra). Se la risposta non c'è, dillo in una frase, imposta "answered": false e suggerisci di aprire un ticket dalla pagina Supporto, senza aggiungere altre informazioni. Non inventare procedure, numeri, tempi o impostazioni.
2. Se moduli e "BASE DI CONOSCENZA DEL TEAM" sono in conflitto, vale la voce più recente della base di conoscenza.
3. Niente consigli clinici o medici (diagnosi, indicazioni, controindicazioni sul paziente): per questi rimanda al medico/personale sanitario responsabile.
4. Se l'utente scrive dati di un paziente, non riportarli e ricordagli di non inserirli.
5. Risposte brevi e operative: passi numerati quando serve, max ~120 parole. Testo semplice, al massimo **grassetto**.
6. In "sources" elenca i titoli delle fonti usate (es. "Modulo Sanificazione", "FAQ: Il visore non si ricarica", "KB: Wi-Fi Careggi").
7. Se una scheda dice a chi rivolgersi (es. prezzi e acquisti → contatto commerciale), quella È la risposta: "answered": true, senza dire che non hai l'informazione e senza suggerire il ticket.
8. Rispondi SOLO a ciò che viene chiesto: non aggiungere informazioni di altre schede non richieste (es. contatti commerciali o prezzi se la domanda non riguarda costi o acquisti).
${profile ? `L'operatore segue il percorso formativo: ${profile}.` : ''}
`.trim();

const SCHEMA = {
  type: 'object',
  properties: {
    question_language: { type: 'string', description: "Lingua in cui è scritta l'ultima domanda dell'utente (es. italiano, English, español)" },
    answer: { type: 'string', description: "La risposta per l'operatore, scritta interamente nella lingua indicata in question_language" },
    sources: { type: 'array', items: { type: 'string' }, description: 'Titoli delle fonti usate' },
    answered: { type: 'boolean', description: 'false se la risposta non è nella conoscenza' },
  },
  required: ['question_language', 'answer', 'sources', 'answered'],
};

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

  if (!CLAUDE_KEY) return res.status(503).json({ error: 'Chatbot non ancora configurato (manca ANTHROPIC_API_KEY).' });

  let knowledge;
  try { knowledge = await getKnowledge(db); }
  catch (e) { return res.status(500).json({ error: 'Errore lettura conoscenza', detail: e.message }); }

  const { data: profileRow } = await db.from('users').select('patient_type').eq('id', userId).maybeSingle();
  const langName = LANG_NAMES[lang] || lang;

  // Claude vuole messaggi alternati utente/assistente che iniziano dall'utente
  const past = (Array.isArray(history) ? history.slice(-6) : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && m.text)
    .map(m => ({ role: m.role, content: String(m.text).slice(0, 1500) }));
  const messages = [];
  for (const m of [...past, { role: 'user', content: q }]) {
    if (!messages.length && m.role !== 'user') continue;
    if (messages.length && messages[messages.length - 1].role === m.role) messages[messages.length - 1].content += '\n\n' + m.content;
    else messages.push({ ...m });
  }

  let out;
  try {
    out = await claudeTool({
      model: CHAT_MODEL,
      cached: `CONOSCENZA\n${knowledge}`,
      system: RULES(langName, profileRow?.patient_type),
      messages,
      schema: SCHEMA,
      description: "Rispondi all'operatore.",
      maxTokens: 800,
    });
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
