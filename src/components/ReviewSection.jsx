import { useEffect, useMemo, useState } from 'react';
import { Check, X, Pencil, Trash2, AlertTriangle, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Scheda "Da revisionare": ogni nuovo utente (e quelli registrati prima di questa funzione) va visto dal team.
// L'operatore usa subito la piattaforma; qui si controlla dopo: Ok, Correggi (nome, ospedale, reparto, pazienti) o Elimina.
const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const officialLabel = (o) => `${o.n} — ${(o.x || 'IT') === 'ES' ? `${o.c}, ${o.p} · España` : `${o.c} (${o.p})`}`;
let officialCache = null;

// avvisi automatici: cosa probabilmente va corretto
function warningsOf(u, ctx) {
  const w = [];
  if (!u.hospital || !u.department || !u.patientType) w.push('Registrazione incompleta');
  if (u.hospital && !ctx.hosp.has(norm(u.hospital))) w.push('Ospedale scritto a mano');
  if (u.department && !ctx.dep.has(norm(u.department))) w.push('Reparto scritto a mano');
  const full = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || '';
  if (!full || full.includes('@')) w.push('Nome mancante');
  else if (full === full.toLowerCase() || full === full.toUpperCase() || !u.lastName) w.push('Nome da sistemare');
  if (/\b(test|prova|demo|asd|qwe)\b/i.test(`${full} ${u.email} ${u.hospital}`)) w.push('Sembra un account di prova');
  if ((ctx.byName.get(norm(full)) || 0) > 1) w.push('Possibile doppione (stesso nome)');
  return w;
}

const Editor = ({ u, ctx, onDone, onCancel }) => {
  const [f, setF] = useState({ first: u.firstName || '', last: u.lastName || '', hosp: u.hospital || '', dep: u.department || '', pt: u.patientType || '' });
  const [addH, setAddH] = useState(false);
  const [addD, setAddD] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const newHosp = f.hosp.trim() && !ctx.hosp.has(norm(f.hosp));
  const newDep = f.dep.trim() && !ctx.dep.has(norm(f.dep));

  const addToList = async (kind, name) => {
    const hit = ctx.catalog.find((r) => r.kind === kind && norm(r.name) === norm(name));
    return hit ? supabase.from('catalog_options').update({ approved: true }).eq('id', hit.id) : supabase.from('catalog_options').insert({ kind, name: name.trim(), approved: true });
  };
  const save = async () => {
    if (!f.first.trim() || !f.last.trim() || f.hosp.trim().length < 2 || f.dep.trim().length < 2) return;
    setBusy(true);
    const { data: me } = await supabase.auth.getUser();
    const first = f.first.trim(), last = f.last.trim();
    const { error } = await supabase.from('users').update({
      first_name: first, last_name: last, name: `${first} ${last}`, hospital: f.hosp.trim(), department: f.dep.trim(),
      patient_type: f.pt || null, reviewed_at: new Date().toISOString(), reviewed_by: me?.user?.id || null,
    }).eq('id', u.id);
    if (!error && newHosp && addH) await addToList('hospital', f.hosp);
    if (!error && newDep && addD) await addToList('department', f.dep);
    setBusy(false);
    if (error) { alert(error.message); return; }
    onDone();
  };

  return (
    <div className="rev-edit">
      <div className="rev-grid">
        <label><span>Nome</span><input className="adm-input" value={f.first} onChange={set('first')} /></label>
        <label><span>Cognome</span><input className="adm-input" value={f.last} onChange={set('last')} /></label>
        <label className="span2"><span>Ospedale</span>
          <input className="adm-input" list={`rh-${u.id}`} value={f.hosp} onChange={set('hosp')} placeholder="Scrivi per cercare nell'elenco" />
          <datalist id={`rh-${u.id}`}>{ctx.hospList.map((x) => <option key={x} value={x} />)}</datalist>
          {newHosp && <em className="rev-new"><input type="checkbox" checked={addH} onChange={(e) => setAddH(e.target.checked)} /> Non è nell'elenco: aggiungilo, così chi viene dopo lo trova</em>}
        </label>
        <label><span>Reparto</span>
          <input className="adm-input" list={`rd-${u.id}`} value={f.dep} onChange={set('dep')} />
          <datalist id={`rd-${u.id}`}>{ctx.depList.map((x) => <option key={x} value={x} />)}</datalist>
          {newDep && <em className="rev-new"><input type="checkbox" checked={addD} onChange={(e) => setAddD(e.target.checked)} /> Aggiungi all'elenco dei reparti</em>}
        </label>
        <label><span>Pazienti</span>
          <select className="adm-input" value={f.pt} onChange={set('pt')}>
            <option value="">—</option><option value="adulti">Adulti</option><option value="pediatria">Pediatria</option>
          </select>
        </label>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={save} disabled={busy} className="adm-act act-green">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Salva e segna come revisionato</button>
        <button onClick={onCancel} className="adm-act act-amber"><X className="w-3.5 h-3.5" /> Annulla</button>
      </div>
    </div>
  );
};

export default function ReviewSection({ users, onChanged, onRemove }) {
  const [catalog, setCatalog] = useState([]);
  const [official, setOfficial] = useState(officialCache || []);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
    supabase.from('catalog_options').select('id,kind,name,approved').then(({ data }) => { if (alive) setCatalog(data || []); });
    if (!officialCache) fetch('/ospedali.json').then((r) => r.json()).then((d) => { officialCache = d; if (alive) setOfficial(d); }).catch(() => {});
    return () => { alive = false; };
  }, [users]);

  const ctx = useMemo(() => {
    const approved = catalog.filter((r) => r.approved);
    const hospList = [...new Set([...approved.filter((r) => r.kind === 'hospital').map((r) => r.name), ...official.map(officialLabel)])].sort();
    const depList = approved.filter((r) => r.kind === 'department').map((r) => r.name).sort();
    const byName = new Map();
    users.forEach((u) => { const k = norm(`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name); if (k) byName.set(k, (byName.get(k) || 0) + 1); });
    return { catalog, hospList, depList, hosp: new Set(hospList.map(norm)), dep: new Set(depList.map(norm)), byName };
  }, [catalog, official, users]);

  const pending = users.filter((u) => !u.reviewedAt).sort((a, b) => new Date(b.firstLogin || 0) - new Date(a.firstLogin || 0));

  const markOk = async (u) => {
    setBusy(u.id);
    const { data: me } = await supabase.auth.getUser();
    const { error } = await supabase.from('users').update({ reviewed_at: new Date().toISOString(), reviewed_by: me?.user?.id || null }).eq('id', u.id);
    setBusy(null);
    if (error) alert(error.message); else onChanged();
  };

  return (
    <section className="adm-panel overflow-hidden">
      <div className="p-7">
        <h3 className="adm-h3 flex items-center gap-2"><UserCheck className="w-5 h-5 text-[#FF8731]" /> Nuovi utenti da revisionare</h3>
        <p className="adm-sub max-w-[70ch]">
          Controlla nome, ospedale e reparto di chi si è registrato. L'operatore usa già la piattaforma: qui sistemi i dati.
          {' '}<b className="text-amber-300">In giallo</b> quello che probabilmente va corretto.
        </p>
      </div>
      <div className="px-7 pb-7 flex flex-col gap-3">
        {pending.length === 0 && <p className="py-10 text-center text-white/45">Tutto revisionato. 🍋</p>}
        {pending.map((u) => {
          const w = warningsOf(u, ctx);
          const full = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || '(senza nome)';
          return (
            <div key={u.id} className={`rev-card ${w.length ? 'warn' : ''}`}>
              <div className="rev-top">
                <div className="min-w-0">
                  <b className="text-white">{full}</b>
                  <span className="text-white/45 text-sm"> · {u.email}{u.phone ? ` · ${u.phone}` : ''}</span>
                  <p className="text-sm text-white/75 mt-1">{u.hospital || <i className="text-white/40">ospedale mancante</i>} · {u.department || <i className="text-white/40">reparto mancante</i>} · {u.patientType === 'pediatria' ? 'Pediatria' : u.patientType === 'adulti' ? 'Adulti' : <i className="text-white/40">pazienti non indicati</i>}</p>
                  <p className="text-xs text-white/40 mt-1">Registrato il {u.firstLogin ? new Date(u.firstLogin).toLocaleDateString('it-IT') : '—'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => markOk(u)} disabled={busy === u.id} className="adm-act act-green" title="I dati sono giusti">{busy === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Ok</button>
                  <button onClick={() => setEditing(editing === u.id ? null : u.id)} className="adm-act act-violet"><Pencil className="w-3.5 h-3.5" /> Correggi</button>
                  <button onClick={() => onRemove(u)} className="adm-act act-red" title="Elimina l'account (es. account di prova)"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {w.length > 0 && <div className="rev-warn">{w.map((x) => <span key={x}><AlertTriangle className="w-3 h-3" /> {x}</span>)}</div>}
              {editing === u.id && <Editor u={u} ctx={ctx} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); onChanged(); }} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
