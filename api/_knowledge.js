// Costruzione del "pacchetto conoscenza" per il chatbot.
// Fonte unica in italiano: moduli + FAQ della piattaforma (dal codice) + base di
// conoscenza modificabile dal pannello admin (tabella kb_entries).
// Il pacchetto viene ricostruito SOLO quando la base di conoscenza cambia
// (kb_version) o quando viene pubblicata una nuova versione del sito.
import { translations } from '../src/i18n/translations.js';

const PROFILES = {
  adulti: ['Introduzione', 'Accensione & Stand-by', 'Posizionamento & Ricarica', 'Sanificazione', 'Menu & Click', 'Simulazione'],
  pediatria: ['Introduzione (Lemo Jr)', 'Accensione & Stand-by (Jr)', 'Posizionamento & Ricarica', 'Sanificazione', 'Posizionamento sul Paziente', 'Navigare tra le Applicazioni Lemons', 'Rabbits', 'Telly', 'Menu & Click'],
};

function staticKnowledge() {
  const it = translations.it;
  const lessons = it.modules.lessons.map((l, i) => {
    const slides = (l.slides || []).map(s => `  - ${s.title}: ${s.content}`).join('\n');
    const quiz = (l.questions || []).map(q => `  - D: ${q.question} R: ${q.answers[q.correct]}`).join('\n');
    const jr = i === 9 || i === 10 ? ' — versione pediatrica (Lemo Jr)' : '';
    return `### MODULO "${l.title}"${jr} (rif. modulo-${i + 1})\n${l.description}\nContenuti:\n${slides}\nPunti chiave verificati dal quiz:\n${quiz}`;
  }).join('\n\n');
  const faqs = (it.support.faqs || []).map(f => `### FAQ: ${f.q}\n${f.a}`).join('\n\n');
  const paths = Object.entries(PROFILES).map(([k, v]) => `- Percorso ${k}: ${v.join(' → ')}`).join('\n');
  return `## PERCORSI FORMATIVI\n${paths}\n\n## MODULI DELLA PIATTAFORMA\n${lessons}\n\n## FAQ DELLA PIATTAFORMA\n${faqs}`;
}

const STATIC_PACK = staticKnowledge();
let cache = { version: null, pack: null };

export async function getKnowledge(db) {
  const { data: version, error: vErr } = await db.rpc('kb_version');
  if (vErr) throw new Error('kb_version: ' + vErr.message);
  if (cache.version === version && cache.pack) return cache.pack;

  const { data: entries, error } = await db
    .from('kb_entries')
    .select('title, content, tags, updated_at')
    .eq('active', true)
    .order('updated_at', { ascending: false });
  if (error) throw new Error('kb_entries: ' + error.message);

  const kb = (entries || []).map(e =>
    `### KB: ${e.title}${e.tags?.length ? ` [${e.tags.join(', ')}]` : ''} (aggiornato ${String(e.updated_at).slice(0, 10)})\n${e.content}`
  ).join('\n\n');

  const pack = `${STATIC_PACK}\n\n## BASE DI CONOSCENZA DEL TEAM LEMONS (più recente: prevale sui moduli se in conflitto)\n${kb || '(nessuna voce)'}`;
  cache = { version, pack };
  return pack;
}
