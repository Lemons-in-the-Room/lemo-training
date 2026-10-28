import { useEffect, useState } from 'react';
import { BookMarked, Plus, Save, Trash2, X, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Base di conoscenza del chatbot (scritta in italiano: il bot risponde in tutte le lingue)
// + ultime domande fatte dagli operatori.
const empty = { id: null, title: '', content: '', tags: '', active: true };

const KnowledgeSection = () => {
  const [entries, setEntries] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(null);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchAll = () => Promise.all([
    supabase.from('kb_entries').select('*').order('updated_at', { ascending: false }),
    supabase.from('chat_logs').select('id, created_at, lang, question, answer, sources, answered').order('created_at', { ascending: false }).limit(100),
  ]);
  const apply = ([{ data: kb }, { data: lg }]) => { setEntries(kb || []); setLogs(lg || []); };
  const load = () => fetchAll().then(apply);
  useEffect(() => {
    let alive = true;
    fetchAll().then(r => { if (alive) apply(r); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setBusy(true);
    const row = {
      title: form.title.trim(),
      content: form.content.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: form.active,
    };
    const { error } = form.id
      ? await supabase.from('kb_entries').update(row).eq('id', form.id)
      : await supabase.from('kb_entries').insert(row);
    setBusy(false);
    if (error) { alert(error.message); return; }
    setForm(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Eliminare questa voce? Il chatbot non la userà più.')) return;
    const { error } = await supabase.from('kb_entries').delete().eq('id', id);
    if (error) alert(error.message);
    load();
  };

  const fromQuestion = (q) => setForm({ ...empty, title: q.question.slice(0, 80), content: '' });

  const shownLogs = onlyUnanswered ? logs.filter(l => !l.answered) : logs;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
      {/* Base di conoscenza */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><BookMarked className="w-6 h-6 text-[#FF8731]" /> Knowledge Base</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Scrivi in italiano: il chatbot la usa subito e risponde in tutte le lingue. {entries.length} voci.</p>
          </div>
          <button onClick={() => setForm({ ...empty })} className="px-4 py-2 bg-[#FF8731] hover:bg-[#FF9E54] text-white rounded-xl font-bold text-sm flex items-center gap-2 shrink-0"><Plus className="w-4 h-4" /> Nuova voce</button>
        </div>

        {form && (
          <div className="p-6 border-b border-slate-800 bg-slate-950/40 space-y-3">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titolo (es. Il visore non si collega al Wi-Fi)" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF8731]/50" />
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Risposta / procedura, come la spiegheresti a un operatore." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF8731]/50" />
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Tag separati da virgola (es. wifi, careggi)" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FF8731]/50" />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 font-semibold mr-auto">
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Attiva
              </label>
              <button onClick={() => setForm(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-sm flex items-center gap-2"><X className="w-4 h-4" /> Annulla</button>
              <button onClick={save} disabled={busy} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center gap-2"><Save className="w-4 h-4" /> Salva</button>
            </div>
          </div>
        )}

        <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-800">
          {entries.length === 0 && <div className="p-10 text-center text-slate-600 font-medium">Nessuna voce. Il chatbot usa moduli e FAQ della piattaforma.</div>}
          {entries.map(e => (
            <div key={e.id} className="p-6 hover:bg-slate-800/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm flex items-center gap-2">
                    {e.active ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    {e.title}
                  </p>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{e.content}</p>
                  <p className="text-slate-600 text-xs mt-2">{(e.tags || []).join(' · ')}{e.tags?.length ? ' — ' : ''}agg. {new Date(e.updated_at).toLocaleDateString('it-IT')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setForm({ id: e.id, title: e.title, content: e.content, tags: (e.tags || []).join(', '), active: e.active })} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold">Modifica</button>
                  <button onClick={() => remove(e.id)} className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Domande al chatbot */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><MessageCircle className="w-6 h-6 text-[#8756FA]" /> Chatbot Questions</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{logs.length} recenti · {logs.filter(l => !l.answered).length} senza risposta</p>
          </div>
          <button onClick={() => setOnlyUnanswered(v => !v)} className={`px-4 py-2 rounded-xl font-bold text-sm border shrink-0 ${onlyUnanswered ? 'bg-[#8756FA] text-white border-transparent' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>Solo senza risposta</button>
        </div>
        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-800">
          {shownLogs.length === 0 && <div className="p-10 text-center text-slate-600 font-medium">Nessuna domanda.</div>}
          {shownLogs.map(l => (
            <div key={l.id} className="p-6">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span>{new Date(l.created_at).toLocaleString('it-IT')}</span>
                <span className="uppercase">{l.lang}</span>
                {!l.answered && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">senza risposta</span>}
              </div>
              <p className="text-white font-semibold text-sm">{l.question}</p>
              <p className="text-slate-400 text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{l.answer}</p>
              {!l.answered && (
                <button onClick={() => fromQuestion(l)} className="mt-2 text-xs font-bold text-[#FF8731] hover:text-white flex items-center gap-1"><Plus className="w-3 h-3" /> Crea voce nella Knowledge Base</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeSection;
