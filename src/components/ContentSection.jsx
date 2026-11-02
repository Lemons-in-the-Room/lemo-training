import { useEffect, useMemo, useState } from 'react';
import { Search, Save, RotateCcw, Check, AlertTriangle, Languages, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase';
import it from '../i18n/lang-it';
import en from '../i18n/lang-en';
import es from '../i18n/lang-es';
import { ui } from '../i18n/ui';

// Scheda "Contenuti": tutti i testi della piattaforma.
// L'italiano è la fonte: modificandolo, inglese e spagnolo vengono ritradotti (Gemini) e segnati "da ricontrollare".
// Le traduzioni si possono correggere a mano. Nel database (content_strings) finiscono solo i testi modificati.
const LANGS = [['it', 'Italiano'], ['en', 'English'], ['es', 'Español']];

const UI_SECTIONS = {
  nav: 'Menu', logout: 'Menu', cue: 'Frecce e pulsanti', home: 'Home', journey: 'Formazione', lesson: 'Lezione',
  quiz: 'Verifica finale', support: 'Supporto', access: 'Accesso e registrazione', onb: 'Primo accesso', chat: 'Chatbot',
  net: 'Avvisi di connessione', notFound: 'Pagina non trovata',
};
const LANG_SECTIONS = { welcome: 'Accesso e registrazione', home: 'Home e certificato', support: 'Supporto' };
const SKIP_LEAF = new Set(['duration', 'dateLocale', 'tag', 'icon', 'id', 'correct']);
const letter = (i) => String.fromCharCode(65 + Number(i));

// elenco piatto delle stringhe: [percorso, testo]
const flat = (o, p = []) => {
  if (typeof o === 'string') return [[p, o]];
  if (!o || typeof o !== 'object') return [];
  return Object.entries(o).flatMap(([k, v]) => flat(v, [...p, k]));
};
const getPath = (o, p) => p.reduce((x, k) => (x == null ? undefined : x[k]), o);

function describe(root, path) {
  if (root === 'lang' && path[0] === 'modules' && path[1] === 'lessons') {
    const n = Number(path[2]); const rest = path.slice(3);
    const section = `Modulo · ${it.modules.lessons[n]?.title || n + 1}`;
    let label = rest.join(' ');
    if (rest[0] === 'title') label = 'Titolo';
    else if (rest[0] === 'description') label = 'Descrizione';
    else if (rest[0] === 'slides') label = `Punto chiave ${Number(rest[1]) + 1} · ${rest[2] === 'title' ? 'titolo' : 'testo'}`;
    else if (rest[0] === 'questions') {
      const q = Number(rest[1]) + 1;
      const Q = it.modules.lessons[n]?.questions?.[rest[1]];
      if (rest[2] === 'question') label = `Domanda ${q}`;
      else if (rest[2] === 'answers') label = `Domanda ${q} · risposta ${letter(rest[3])}${Q && Number(rest[3]) === Q.correct ? ' (corretta)' : ''}`;
      else label = `Domanda ${q} · ${rest.slice(2).join(' ')}`;
    }
    return { section, label, order: `0-${String(n).padStart(2, '0')}` };
  }
  if (root === 'lang' && path[0] === 'support' && path[1] === 'faqs') {
    return { section: 'Supporto · FAQ', label: `FAQ ${Number(path[2]) + 1} · ${path[3] === 'q' ? 'domanda' : 'risposta'}`, order: '2-faq' };
  }
  if (root === 'lang') return { section: LANG_SECTIONS[path[0]] || 'Altri testi', label: path.slice(1).join(' · '), order: `3-${path[0]}` };
  return { section: UI_SECTIONS[path[0]] || path[0], label: path.slice(1).join(' · '), order: `1-${path[0]}` };
}

// eslint-disable-next-line react-refresh/only-export-components -- esportata solo per i test
export function buildCatalog() {
  const rows = [];
  const add = (root, base, keep) => flat(base).forEach(([p, text]) => {
    if (!keep(p) || SKIP_LEAF.has(p[p.length - 1]) || !/\p{L}/u.test(text)) return;
    const key = `${root}.${p.join('.')}`;
    const other = root === 'lang' ? { en: getPath(en, p), es: getPath(es, p) } : { en: getPath(ui.en, p), es: getPath(ui.es, p) };
    rows.push({ key, it: text, en: typeof other.en === 'string' ? other.en : '', es: typeof other.es === 'string' ? other.es : '', ...describe(root, p) });
  });
  add('lang', it, (p) => (p[0] === 'modules' && (p[1] === 'lessons' || p[1] === 'menuClickDescPediatria')) || ['welcome', 'home', 'support'].includes(p[0]));
  add('ui', ui.it, () => true);
  return rows;
}

const placeholders = (s) => (String(s || '').match(/\{\w+\}/g) || []).sort().join(',');

export default function ContentSection() {
  const catalog = useMemo(() => buildCatalog(), []);
  const [saved, setSaved] = useState({}); // key -> riga del database
  const [draft, setDraft] = useState({}); // key -> { it, en, es }
  const [busy, setBusy] = useState({});
  const [q, setQ] = useState('');
  const [section, setSection] = useState('all');
  const [only, setOnly] = useState('all'); // all | review | changed
  const [msg, setMsg] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('content_strings').select('*');
    if (error) { setMsg(error.message); return; }
    setSaved(Object.fromEntries((data || []).map((r) => [r.key, r])));
  };
  useEffect(() => {
    let alive = true;
    supabase.from('content_strings').select('*').then(({ data, error }) => {
      if (!alive) return;
      if (error) setMsg(error.message); else setSaved(Object.fromEntries((data || []).map((r) => [r.key, r])));
    });
    return () => { alive = false; };
  }, []);

  const sections = useMemo(() => [...new Map(catalog.map((r) => [r.section, r.order])).entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([s]) => s), [catalog]);
  const current = (r) => {
    const s = saved[r.key];
    return { it: s?.it || r.it, en: s?.en || r.en, es: s?.es || r.es, enReview: s?.en_status === 'review', esReview: s?.es_status === 'review', changed: !!s };
  };
  const reviewCount = Object.values(saved).filter((s) => s.en_status === 'review' || s.es_status === 'review').length;

  const rows = catalog.filter((r) => {
    const c = current(r);
    if (section !== 'all' && r.section !== section) return false;
    if (only === 'review' && !(c.enReview || c.esReview)) return false;
    if (only === 'changed' && !c.changed) return false;
    if (q) { const t = q.toLowerCase(); return [c.it, c.en, c.es, r.label].some((x) => String(x).toLowerCase().includes(t)); }
    return true;
  });

  const notify = () => window.dispatchEvent(new Event('lemo-texts-changed'));
  const setBusyKey = (k, v) => setBusy((b) => ({ ...b, [k]: v }));
  const upsert = async (row) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('content_strings').upsert({ ...row, updated_at: new Date().toISOString(), updated_by: u?.user?.id || null }, { onConflict: 'key' });
    if (error) throw error;
  };

  const translate = async (items) => {
    const { data } = await supabase.auth.getSession();
    const r = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data?.session?.access_token || '') },
      body: JSON.stringify({ items, targets: ['en', 'es'] }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Traduzione non riuscita');
    return j;
  };

  // salva l'italiano e ritraduce inglese e spagnolo
  const saveIt = async (r, text) => {
    setBusyKey(r.key, 'it'); setMsg('');
    try {
      const tr = await translate([{ key: r.key, it: text }]);
      await upsert({ key: r.key, section: r.section, it: text, en: tr.en?.[r.key] || current(r).en, es: tr.es?.[r.key] || current(r).es, en_status: 'review', es_status: 'review' });
      setDraft((d) => { const n = { ...d }; delete n[r.key]; return n; });
      await load(); notify();
    } catch (e) { setMsg(`${r.label}: ${e.message}`); }
    setBusyKey(r.key, null);
  };

  // salva una traduzione corretta a mano
  const saveTr = async (r, lang, text) => {
    setBusyKey(r.key, lang); setMsg('');
    try {
      const c = current(r);
      await upsert({ key: r.key, section: r.section, it: c.it, en: lang === 'en' ? text : c.en, es: lang === 'es' ? text : c.es,
        en_status: lang === 'en' ? 'ok' : (saved[r.key]?.en_status || 'ok'), es_status: lang === 'es' ? 'ok' : (saved[r.key]?.es_status || 'ok') });
      setDraft((d) => { const n = { ...d }; if (n[r.key]) { n[r.key] = { ...n[r.key] }; delete n[r.key][lang]; } return n; });
      await load(); notify();
    } catch (e) { setMsg(`${r.label}: ${e.message}`); }
    setBusyKey(r.key, null);
  };

  const markOk = async (r, lang) => {
    setBusyKey(r.key, lang);
    const { error } = await supabase.from('content_strings').update({ [`${lang}_status`]: 'ok' }).eq('key', r.key);
    if (error) setMsg(error.message);
    await load(); setBusyKey(r.key, null);
  };

  const restore = async (r) => {
    if (!window.confirm(`Ripristinare il testo originale di "${r.label}" in tutte le lingue?`)) return;
    setBusyKey(r.key, 'reset');
    const { error } = await supabase.from('content_strings').delete().eq('key', r.key);
    if (error) setMsg(error.message);
    setDraft((d) => { const n = { ...d }; delete n[r.key]; return n; });
    await load(); notify(); setBusyKey(r.key, null);
  };

  const [bulk, setBulk] = useState('');
  // ritraduce tutti i testi della sezione scelta (utile dopo molte modifiche all'italiano)
  const retranslateSection = async () => {
    const list = rows.filter((r) => current(r).changed);
    if (!list.length) { setMsg('In questa vista non ci sono testi modificati da ritradurre.'); return; }
    if (!window.confirm(`Ritradurre ${list.length} testi modificati? Inglese e spagnolo verranno sostituiti e segnati "da ricontrollare".`)) return;
    setMsg('');
    for (let i = 0; i < list.length; i += 40) {
      const part = list.slice(i, i + 40);
      setBulk(`${Math.min(i + 40, list.length)} di ${list.length}…`);
      try {
        const tr = await translate(part.map((r) => ({ key: r.key, it: current(r).it })));
        for (const r of part) await upsert({ key: r.key, section: r.section, it: current(r).it, en: tr.en?.[r.key] || current(r).en, es: tr.es?.[r.key] || current(r).es, en_status: 'review', es_status: 'review' });
      } catch (e) { setMsg(e.message); break; }
    }
    setBulk(''); await load(); notify();
  };

  const field = (r, lang) => draft[r.key]?.[lang] ?? current(r)[lang];
  const edit = (r, lang, v) => setDraft((d) => ({ ...d, [r.key]: { ...(d[r.key] || {}), [lang]: v } }));
  const dirty = (r, lang) => draft[r.key]?.[lang] != null && draft[r.key][lang] !== current(r)[lang];

  return (
    <section className="adm-panel overflow-hidden">
      <div className="p-7 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <h3 className="adm-h3">Contenuti e traduzioni</h3>
          <p className="adm-sub max-w-[62ch]">
            Modifica l'italiano e salva: inglese e spagnolo vengono ritradotti in automatico e segnati <b className="text-amber-300">da ricontrollare</b>.
            Puoi correggere a mano qualsiasi traduzione. Le modifiche compaiono sulla piattaforma subito.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={section} onChange={(e) => setSection(e.target.value)} className="adm-input max-w-[260px]">
            <option value="all">Tutte le sezioni</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {[['all', 'Tutti'], ['review', `Da ricontrollare${reviewCount ? ` (${reviewCount})` : ''}`], ['changed', 'Modificati']].map(([k, l]) => (
            <button key={k} onClick={() => setOnly(k)} className={`adm-chip ${only === k ? 'on' : ''}`}>{l}</button>
          ))}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca un testo…" className="adm-input !pl-10 w-56" />
          </div>
          <button onClick={retranslateSection} disabled={!!bulk} className="adm-btn" title="Ritraduce i testi modificati visibili in elenco">
            {bulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {bulk || 'Ritraduci i modificati'}
          </button>
        </div>
      </div>
      {msg && <p className="mx-7 mb-4 text-sm font-semibold text-red-300 bg-red-500/10 rounded-2xl px-5 py-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {msg}</p>}
      <p className="px-7 pb-3 text-xs text-white/40">{rows.length} testi</p>

      <div className="adm-content">
        {rows.length === 0 && <p className="py-14 text-center text-white/50">Nessun testo con questi filtri.</p>}
        {rows.map((r, i) => {
          const c = current(r);
          const head = i === 0 || rows[i - 1].section !== r.section ? r.section : null;
          const phIt = placeholders(field(r, 'it'));
          return (
            <div key={r.key}>
              {head && <h4 className="adm-content-sec">{head}</h4>}
              <div className={`adm-text ${c.changed ? 'changed' : ''}`}>
                <div className="adm-text-head">
                  <b>{r.label}</b>
                  {c.changed && <span className="adm-tag tag-violet">Modificato</span>}
                  {c.changed && <button onClick={() => restore(r)} disabled={!!busy[r.key]} className="adm-link ml-auto"><RotateCcw className="w-3.5 h-3.5" /> Ripristina l'originale</button>}
                </div>
                <div className="adm-text-grid">
                  {LANGS.map(([lang, name]) => {
                    const review = lang === 'en' ? c.enReview : lang === 'es' ? c.esReview : false;
                    const v = field(r, lang);
                    const phBad = lang !== 'it' && placeholders(v) !== phIt;
                    return (
                      <div key={lang} className={`adm-text-col ${review ? 'review' : ''}`}>
                        <div className="adm-text-lang">
                          <span>{name}{lang === 'it' && ' · fonte'}</span>
                          {review && <span className="text-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> da ricontrollare</span>}
                        </div>
                        <textarea value={v} onChange={(e) => edit(r, lang, e.target.value)} rows={Math.min(8, Math.max(2, Math.ceil(String(v).length / 52)))} className="adm-input w-full" />
                        {phBad && <p className="text-xs text-red-300 mt-1">Mancano o avanzano dei segnaposto come {phIt || '{n}'}: vanno lasciati uguali all'italiano.</p>}
                        {(dirty(r, lang) || review) && <div className="flex gap-2 mt-2">
                          {dirty(r, lang) && (lang === 'it'
                            ? <button onClick={() => saveIt(r, v)} disabled={!!busy[r.key] || !v.trim()} className="adm-act act-green">{busy[r.key] === 'it' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />} Salva e traduci</button>
                            : <button onClick={() => saveTr(r, lang, v)} disabled={!!busy[r.key] || !v.trim() || phBad} className="adm-act act-green">{busy[r.key] === lang ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Salva</button>)}
                          {review && !dirty(r, lang) && <button onClick={() => markOk(r, lang)} disabled={!!busy[r.key]} className="adm-act act-violet"><Check className="w-3.5 h-3.5" /> Va bene così</button>}
                        </div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
