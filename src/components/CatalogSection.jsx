import { useEffect, useState } from 'react';
import { Building2, Stethoscope, Check, Trash2, Plus, Pencil, X, Save } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Elenchi di ospedali e reparti usati nella registrazione.
// "Da approvare" = scritti a mano dagli operatori con "Altro".
const KINDS = [
  { kind: 'hospital', title: 'Ospedali', icon: Building2 },
  { kind: 'department', title: 'Reparti', icon: Stethoscope },
];

export default function CatalogSection() {
  const [rows, setRows] = useState([]);
  const [newName, setNewName] = useState({ hospital: '', department: '' });
  const [edit, setEdit] = useState(null); // { id, name, old, kind }
  const [note, setNote] = useState('');

  const fetchRows = () => supabase.from('catalog_options').select('*').order('approved').order('name');
  const load = () => fetchRows().then(({ data }) => setRows(data || []));
  useEffect(() => {
    let alive = true;
    fetchRows().then(({ data }) => { if (alive) setRows(data || []); });
    return () => { alive = false; };
  }, []);

  const run = async (q) => { const { error } = await q; if (error) alert(error.message); load(); };
  const approve = (id) => run(supabase.from('catalog_options').update({ approved: true }).eq('id', id));
  const remove = (r) => { if (confirm(`Togliere "${r.name}" dall'elenco? Gli operatori già registrati non cambiano.`)) run(supabase.from('catalog_options').delete().eq('id', r.id)); };
  const add = (kind) => { const n = newName[kind].trim(); if (n.length < 2) return; setNewName({ ...newName, [kind]: '' }); run(supabase.from('catalog_options').insert({ kind, name: n, approved: true })); };
  // Rinomina: cambia la voce dell'elenco e anche il nome sugli operatori già registrati con quel nome
  const rename = async () => {
    const n = edit.name.trim(); if (n.length < 2) return;
    const { id, old, kind } = edit; setEdit(null);
    if (n === old) return;
    const col = kind === 'hospital' ? 'hospital' : 'department';
    const { error } = await supabase.from('catalog_options').update({ name: n }).eq('id', id);
    if (error) { alert(error.message); load(); return; }
    const { data: moved, error: e2 } = await supabase.from('users').update({ [col]: n }).eq(col, old).select('id');
    if (e2) alert(e2.message);
    setNote(`«${old}» → «${n}»: aggiornato anche su ${moved?.length || 0} ${moved?.length === 1 ? 'operatore' : 'operatori'}.`);
    load();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
      {note && <p className="xl:col-span-2 text-sm font-semibold text-emerald-300 bg-emerald-500/10 rounded-2xl px-5 py-3 flex items-center gap-2"><Check className="w-4 h-4" /> {note}<button onClick={() => setNote('')} className="ml-auto text-emerald-300/70 hover:text-white"><X className="w-4 h-4" /></button></p>}
      {KINDS.map(({ kind, title, icon: Icon }) => {
        const list = rows.filter((r) => r.kind === kind);
        const pending = list.filter((r) => !r.approved);
        const approved = list.filter((r) => r.approved);
        return (
          <div key={kind} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-800">
              <h3 className="text-2xl font-black text-white flex items-center gap-2"><Icon className="w-6 h-6 text-[#FF8731]" /> {title}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Elenco della registrazione: {approved.length} voci{pending.length ? `, ${pending.length} da approvare` : ''}.</p>
              <div className="flex gap-2 mt-4">
                <input value={newName[kind]} onChange={(e) => setNewName({ ...newName, [kind]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && add(kind)} placeholder={kind === 'hospital' ? 'Aggiungi un ospedale' : 'Aggiungi un reparto'} className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FF8731]/50" />
                <button onClick={() => add(kind)} className="px-4 py-2 bg-[#FF8731] hover:bg-[#FF9E54] text-white rounded-xl font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi</button>
              </div>
            </div>
            {pending.length > 0 && (
              <div className="p-6 border-b border-slate-800 bg-amber-500/5">
                <p className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3">Da approvare (scritti a mano dagli operatori)</p>
                <ul className="space-y-2">
                  {pending.map((r) => (
                    <li key={r.id} className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5">
                      {edit?.id === r.id
                        ? <input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && rename()} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none" />
                        : <span className="flex-1 text-sm font-semibold text-white">{r.name}</span>}
                      {edit?.id === r.id
                        ? <><button onClick={rename} title="Salva" className="p-2 text-emerald-400 hover:bg-slate-700 rounded-lg"><Save className="w-4 h-4" /></button><button onClick={() => setEdit(null)} title="Annulla" className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"><X className="w-4 h-4" /></button></>
                        : <button onClick={() => setEdit({ id: r.id, name: r.name, old: r.name, kind })} title="Correggi il nome (anche sugli operatori registrati)" className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"><Pencil className="w-4 h-4" /></button>}
                      <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approva</button>
                      <button onClick={() => remove(r)} title="Scarta" className="p-2 text-red-400 hover:bg-slate-700 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="p-6 max-h-[360px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
              {approved.map((r) => (
                <li key={r.id} className="group flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2 text-sm text-slate-200">
                  {edit?.id === r.id
                    ? <><input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && rename()} className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-sm outline-none" /><button onClick={rename} className="p-1 text-emerald-400"><Save className="w-4 h-4" /></button></>
                    : <><span className="flex-1 min-w-0 truncate">{r.name}</span>
                      <button onClick={() => setEdit({ id: r.id, name: r.name, old: r.name, kind })} title="Rinomina (anche sugli operatori registrati)" className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(r)} title="Togli" className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
