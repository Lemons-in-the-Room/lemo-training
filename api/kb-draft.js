/* global process */
// POST /api/kb-draft — riscrive "in bella copia" la correzione di un collega come scheda per il chatbot (solo admin).
// Body: { question, bot_answer, correction } -> { title, content, tags }
// Nessuna scrittura: la scheda la salva la dashboard dopo l'approvazione.
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/utils/supabase.js';
import { CLAUDE_KEY, claudeTool } from './_claude.js';

const MODEL = process.env.KB_DRAFT_MODEL || 'claude-sonnet-5-5';

const PROMPT = ({ question, bot_answer, correction }) => `
Sei l'editor della base di conoscenza del chatbot di supporto di Lemons in the Room (visori VR in ospedale, per infermieri e medici).
Un collega del team ha corretto una risposta del chatbot. Trasforma la sua correzione in una SCHEDA pulita.

Regole:
- Usa SOLO le informazioni della correzione del collega. Non aggiungere fatti, numeri, tempi o procedure che lui non ha scritto.
- Riscrivila in bella copia: italiano corretto, chiaro, frasi brevi, dai del tu all'operatore. Passi numerati se è una procedura.
- La scheda deve rispondere anche a domande simili, non solo a quella esatta.
- Niente consigli clinici.
- Se la correzione è incompleta, scrivi solo quello che c'è.
- Titolo breve (max 60 caratteri) che descrive l'argomento, non la domanda. 3-6 tag in minuscolo (sinonimi utili per la ricerca).

Domanda dell'operatore: ${question}
Risposta del chatbot (sbagliata o incompleta): ${bot_answer || '(nessuna)'}
Correzione del collega: ${correction}
`.trim();

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

  const { question = '', bot_answer = '', correction = '' } = req.body || {};
  if (!String(correction).trim()) return res.status(400).json({ error: 'Correzione vuota' });
  try {
    const out = await claudeTool({
      model: MODEL,
      messages: [{ role: 'user', content: PROMPT({ question: String(question).slice(0, 1000), bot_answer: String(bot_answer).slice(0, 3000), correction: String(correction).slice(0, 4000) }) }],
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'content', 'tags'],
      },
      name: 'scheda',
      description: 'Restituisci la scheda pronta.',
      maxTokens: 1500,
    });
    return res.status(200).json({ title: out.title, content: out.content, tags: (out.tags || []).slice(0, 8) });
  } catch (e) {
    return res.status(502).json({ error: 'Non sono riuscito a preparare la scheda', detail: e.message });
  }
}
