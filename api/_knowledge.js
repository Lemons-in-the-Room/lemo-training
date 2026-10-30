// Costruzione del "pacchetto conoscenza" per il chatbot.
// Fonte unica in italiano: moduli + FAQ della piattaforma (dal codice) + base di
// conoscenza modificabile dal pannello admin (tabella kb_entries).
// Il pacchetto viene ricostruito SOLO quando la base di conoscenza cambia
// (kb_version) o quando viene pubblicata una nuova versione del sito.
import itBase from '../src/i18n/lang-it.js';

// testi italiani modificati dalla dashboard (content_strings) sovrapposti a quelli del codice
const deepClone = (o) => (Array.isArray(o) ? o.map(deepClone) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepClone(v)])) : o); // copia anche oggetti con funzioni (structuredClone non può)
const withOverrides = (rows) => {
  const it = deepClone(itBase);
  for (const r of rows || []) {
    const [root, ...p] = r.key.split('.');
    if (root !== 'lang' || !r.it) continue;
    const parent = p.slice(0, -1).reduce((o, k) => (o == null ? undefined : o[k]), it);
    if (parent && typeof parent[p[p.length - 1]] === 'string') parent[p[p.length - 1]] = r.it;
  }
  return it;
};

const PROFILES = {
  adulti: ['Introduzione', 'Accensione & Stand-by', 'Posizionamento & Ricarica', 'Sanificazione', 'Menu & Click', 'Simulazione'],
  pediatria: ['Introduzione (Lemo Jr)', 'Accensione & Stand-by (Jr)', 'Posizionamento & Ricarica', 'Sanificazione', 'Posizionamento sul Paziente', 'Navigare tra le Applicazioni Lemons', 'Rabbits', 'Telly', 'Menu & Click'],
};

function staticKnowledge(rows) {
  const it = withOverrides(rows);
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

let cache = { version: null, pack: null };

export async function getKnowledge(db) {
  const { data: version, error: vErr } = await db.rpc('kb_version');
  if (vErr) throw new Error('kb_version: ' + vErr.message);
  const { data: texts } = await db.from('content_strings').select('key,it,updated_at');
  const stamp = `${version}|${(texts || []).length}|${(texts || []).reduce((m, r) => (r.updated_at > m ? r.updated_at : m), '')}`;
  if (cache.version === stamp && cache.pack) return cache.pack;

  const { data: entries, error } = await db
    .from('kb_entries')
    .select('title, content, tags, updated_at')
    .eq('active', true)
    .order('updated_at', { ascending: false });
  if (error) throw new Error('kb_entries: ' + error.message);

  const kb = (entries || []).map(e =>
    `### KB: ${e.title}${e.tags?.length ? ` [${e.tags.join(', ')}]` : ''} (aggiornato ${String(e.updated_at).slice(0, 10)})\n${e.content}`
  ).join('\n\n');

  const pack = `${staticKnowledge(texts)}\n\n## BASE DI CONOSCENZA DEL TEAM LEMONS (più recente: prevale sui moduli se in conflitto)\n${kb || '(nessuna voce)'}`;
  cache = { version: stamp, pack };
  return pack;
}
