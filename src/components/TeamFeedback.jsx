import { useEffect, useState } from 'react';
import { Sparkles, Check, X, Loader2, ThumbsUp, PenLine } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Correzioni del team alle risposte del chatbot (tabella chat_feedback).
// "Prepara scheda" fa riscrivere la correzione in bella copia (Claude Sonnet, /api/kb-draft);
// la scheda si può ritoccare e poi si pubblica nella base di conoscenza.
const TeamFeedback = ({ onPublished }) => {
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [okCount, setOkCount] = useState(0);
  const [draft, setDraft] = useState({}); // id -> { title, content, tags, busy, error }
  const [msg, setMsg] = useState('');

  const fetchAll = async () => {
    const [{ data: fb }, { count }] = await Promise.all([
      supabase.from('chat_feedback').select('*').eq('verdict', 'wrong').eq('status', 'new').order('created_at', { ascending: false }),
      supabase.from('chat_feedback').select('id', { count: 'exact', head: true }).eq('verdict', 'ok'),
    ]);
    const list = fb || [];
    const ids = [...new Set(list.map((r) => r.user_id))];
    const { data: us } = ids.length ? await supabase.from('users').select('id, name, first_name').in('id', ids) : { data: [] };
    return { list, count: count || 0, names: Object.fromEntries((us || []).map((u) => [u.id, u.first_name || u.name || ''])) };
  };
  const apply = (r) => { setRows(r.list); setOkCount(r.count); setNames(r.names); };
  useEffect(() => {
    let alive = true;
    fetchAll().then((r) => { if (alive) apply(r); });
    return () => { alive = false; };
  }, []);
  const reload = () => fetchAll().then(apply);

  const set = (id, patch) => setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));

  const prepare = async (r) => {
    set(r.id, { busy: 'prep', error: '' });
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/kb-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data?.session?.access_token || '') },
        body: JSON.stringify({ question: r.question, bot_answer: r.bot_answer, correction: r.correction }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Errore');
      set(r.id, { busy: false, title: j.title, content: j.content, tags: (j.tags || []).join(', ') });
    } catch (e) { set(r.id, { busy: false, error: e.message }); }
  };

  const publish = async (r) => {
    const d = draft[r.id];
    if (!d?.title?.trim() || !d?.content?.trim()) return;
    set(r.id, { busy: 'pub', error: '' });
    const { data: kb, error } = await supabase.from('kb_entries').insert({
      title: d.title.trim(), content: d.content.trim(), tags: String(d.tags || '').split(',').map((t) => t.trim()).filter(Boolean), active: true,
    }).select('id').single();
    if (error) { set(r.id, { busy: false, error: error.message }); return; }
    await supabase.from('chat_feedback').update({ status: 'done', kb_entry_id: kb.id, reviewed_at: new Date().toISOString() }).eq('id', r.id);
    setMsg(`Scheda "${d.title.trim()}" pubblicata: il chatbot la usa da subito.`);
    reload(); onPublished?.();
  };

  const discard = async (r) => {
    if (!window.confirm('Scartare questa correzione?')) return;
    await supabase.from('chat_feedback').update({ status: 'discarded', reviewed_at: new Date().toISOString() }).eq('id', r.id);
    reload();
  };

  return (
    <section className="adm-panel overflow-hidden mb-6">
      <div className="p-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="adm-h3 flex items-center gap-2"><PenLine className="w-5 h-5 text-[#FF8731]" /> Correzioni del team</h3>
          <p className="adm-sub max-w-[64ch]">
            Quando un collega (account @lemonsintheroom.com) corregge una risposta del chatbot, la trovi qui.
            "Prepara scheda" la riscrive in bella copia; la ritocchi se serve e la pubblichi.
          </p>
        </div>
        <p className="text-sm text-white/60 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-emerald-400" /> {okCount} risposte segnate come giuste</p>
      </div>
      {msg && <p className="mx-7 mb-4 text-sm font-semibold text-emerald-300 bg-emerald-500/10 rounded-2xl px-5 py-3">{msg}</p>}
      <div className="px-7 pb-7 flex flex-col gap-4">
        {rows.length === 0 && <p className="py-8 text-center text-white/45">Nessuna correzione da rivedere.</p>}
        {rows.map((r) => {
          const d = draft[r.id] || {};
          return (
            <div key={r.id} className="adm-text">
              <div className="adm-text-head">
                <b>{r.question || '(domanda non disponibile)'}</b>
                <span className="text-xs text-white/45 ml-auto">{names[r.user_id] || 'Collega'} · {new Date(r.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="adm-text-grid" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                <div className="adm-text-col">
                  <div className="adm-text-lang"><span>Risposta del chatbot</span></div>
                  <p className="text-sm text-white/55 whitespace-pre-wrap">{r.bot_answer}</p>
                </div>
                <div className="adm-text-col">
                  <div className="adm-text-lang"><span>Correzione del collega</span></div>
                  <p className="text-sm text-white whitespace-pre-wrap">{r.correction}</p>
                </div>
              </div>
              {d.content != null && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="adm-text-lang"><span>Scheda in bella copia (modificabile)</span></div>
                  <input className="adm-input" value={d.title} onChange={(e) => set(r.id, { title: e.target.value })} placeholder="Titolo" />
                  <textarea className="adm-input" rows={6} value={d.content} onChange={(e) => set(r.id, { content: e.target.value })} />
                  <input className="adm-input" value={d.tags} onChange={(e) => set(r.id, { tags: e.target.value })} placeholder="Tag separati da virgola" />
                </div>
              )}
              {d.error && <p className="text-sm text-red-300 mt-2">{d.error}</p>}
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={() => prepare(r)} disabled={d.busy} className="adm-act act-violet">
                  {d.busy === 'prep' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} {d.content != null ? 'Riscrivi di nuovo' : 'Prepara scheda'}
                </button>
                {d.content != null && (
                  <button onClick={() => publish(r)} disabled={d.busy || !d.title?.trim() || !d.content?.trim()} className="adm-act act-green">
                    {d.busy === 'pub' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Pubblica scheda
                  </button>
                )}
                <button onClick={() => discard(r)} disabled={d.busy} className="adm-act act-red ml-auto"><X className="w-3.5 h-3.5" /> Scarta</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TeamFeedback;
