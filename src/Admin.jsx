import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Award, ClipboardCheck, Tablet, PlayCircle, Search, Download, RefreshCw, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, X, AlertTriangle, RotateCcw, Unlock, Trash2, ShieldCheck, ShieldOff, ArrowUpDown,
  Building2, Baby, UserRound, LayoutDashboard, MessageCircle, Mail, LogOut, ExternalLink, Check, Eye, EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from './utils/supabase';
import { translations } from './i18n/translations';
import { getLessons, profileOf } from './course';
import KnowledgeSection from './components/KnowledgeSection';
import CatalogSection from './components/CatalogSection';
import './styles/admin.css';

const PER_PAGE = 20;
const LESSONS = { adulti: getLessons(translations.it, 'adulti'), pediatria: getLessons(translations.it, 'pediatria') };

// Account interni e di prova: esclusi dai numeri (si possono rivedere con l'interruttore in alto).
const isInternal = (u) =>
  /@lemonsintheroom\.com$/i.test(u.email || '') || /test|lemons in the room/i.test(u.hospital || '');

const STATUS = {
  cert:       { label: 'Certificato',              cls: 'st-cert' },
  retry:      { label: 'Verifica da ritentare',    cls: 'st-retry' },
  quiz:       { label: 'Deve fare la verifica',    cls: 'st-quiz' },
  progress:   { label: 'In formazione',            cls: 'st-progress' },
  new:        { label: 'Non ha iniziato',          cls: 'st-new' },
  incomplete: { label: 'Registrazione incompleta', cls: 'st-incomplete' },
};

const statusOf = (u) => {
  if (u.quizPassedAt) return 'cert';
  if (!u.patientType) return 'incomplete';
  if (u.doneCount >= u.total) return u.quizBest != null ? 'retry' : 'quiz';
  return u.doneCount > 0 ? 'progress' : 'new';
};

const itDate = (iso, time = false) => (iso ? new Date(iso).toLocaleString('it-IT', time
  ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  : { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—');

const timeAgo = (iso) => {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'adesso';
  if (s < 3600) return `${Math.floor(s / 60)} min fa`;
  if (s < 86400) return `${Math.floor(s / 3600)} ore fa`;
  if (s < 172800) return 'ieri';
  return `${Math.floor(s / 86400)} giorni fa`;
};

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const download = (name, head, body) => {
  const csv = '\uFEFF' + [head.map(esc).join(';'), ...body.map((r) => r.map(esc).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = name; a.click();
};

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = true }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#03091B]/80" onClick={onCancel} />
        <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }} className="adm-panel relative z-10 p-8 max-w-md w-full">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${danger ? 'bg-red-500/15' : 'bg-amber-500/15'}`}>
            <AlertTriangle className={`w-7 h-7 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className="adm-h3 text-center mb-2">{title}</h3>
          <p className="text-white/60 text-center text-sm mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="adm-btn flex-1 justify-center">Annulla</button>
            <button onClick={onConfirm} className={`adm-btn flex-1 justify-center !text-white !border-transparent ${danger ? '!bg-red-500 hover:!bg-red-600' : '!bg-amber-500 hover:!bg-amber-600'}`}>Conferma</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Badge = ({ s }) => <span className={`adm-badge ${STATUS[s].cls}`}>{STATUS[s].label}</span>;

const Kpi = ({ icon: I, label, value, sub, tone, onClick }) => (
  <button type="button" onClick={onClick} className={`adm-kpi tone-${tone}`}>
    <I className="w-5 h-5" />
    <p className="adm-kpi-v">{value}</p>
    <p className="adm-kpi-l">{label}</p>
    {sub && <p className="adm-kpi-s">{sub}</p>}
  </button>
);

/* ---------------- PANORAMICA ---------------- */
const Overview = ({ users, onPick }) => {
  const reg = users.filter((u) => u.patientType);
  const by = (s) => users.filter((u) => u.status === s).length;
  const cert = by('cert');
  const week = users.filter((u) => u.lastLogin && Date.now() - new Date(u.lastLogin) < 7 * 864e5).length;

  const funnel = [
    { k: 'Registrati', n: reg.length },
    { k: 'Hanno iniziato', n: reg.filter((u) => u.doneCount > 0 || u.quizPassedAt).length },
    { k: 'A metà percorso', n: reg.filter((u) => u.doneCount >= u.total / 2 || u.quizPassedAt).length },
    { k: 'Tutte le tappe fatte', n: reg.filter((u) => u.doneCount >= u.total || u.quizPassedAt).length },
    { k: 'Certificati', n: cert },
  ];

  // Dove si fermano: per chi non è certificato, la prossima tappa da fare
  const stuck = ['adulti', 'pediatria'].map((p) => {
    const list = reg.filter((u) => profileOf(u.patientType) === p && !u.quizPassedAt);
    const rows = LESSONS[p].map((l, i) => ({ i, title: l.title, n: list.filter((u) => u.nextIdx === i).length }));
    rows.push({ i: 'q', title: 'Verifica finale', n: list.filter((u) => u.nextIdx === -1).length });
    return { p, total: list.length, rows };
  });

  // Andamento: ultime 12 settimane
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const end = new Date(); end.setHours(23, 59, 59, 999); end.setDate(end.getDate() - (11 - i) * 7);
    const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    const inW = (d) => d && new Date(d) >= start && new Date(d) <= end;
    return {
      name: start.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }),
      Iscritti: users.filter((u) => inW(u.firstLogin)).length,
      Certificati: users.filter((u) => inW(u.quizPassedAt)).length,
    };
  });

  const adulti = reg.filter((u) => profileOf(u.patientType) === 'adulti').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi icon={Users} tone="blue" label="Operatori" value={users.length} sub={`${week} attivi negli ultimi 7 giorni`} onClick={() => onPick('all')} />
        <Kpi icon={PlayCircle} tone="orange" label="In formazione" value={by('progress') + by('new')} sub={`${by('new')} non hanno ancora iniziato`} onClick={() => onPick('progress')} />
        <Kpi icon={ClipboardCheck} tone="violet" label="Devono fare la verifica" value={by('quiz') + by('retry')} sub={by('retry') ? `${by('retry')} da ritentare` : 'nessuno da ritentare'} onClick={() => onPick('quiz')} />
        <Kpi icon={Award} tone="green" label="Certificati" value={cert} sub={`${pct(cert, reg.length)}% dei registrati`} onClick={() => onPick('cert')} />
        <Kpi icon={Tablet} tone="sky" label="Usano il tablet" value={users.filter((u) => u.usesTablet).length} sub={`${users.filter((u) => u.priorOnboarding).length} con onboarding già fatto`} onClick={() => onPick('all')} />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="adm-panel p-7 lg:col-span-3">
          <h3 className="adm-h3">Il percorso degli operatori</h3>
          <p className="adm-sub mb-6">Quanti arrivano a ogni punto, sul totale dei registrati</p>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.k} className="adm-funnel">
                <span className="adm-funnel-k">{f.k}</span>
                <div className="adm-funnel-bar"><i style={{ width: `${f.n ? Math.max(pct(f.n, funnel[0].n), 3) : 0}%`, opacity: 1 - i * 0.12 }} /></div>
                <b>{f.n}</b><em>{pct(f.n, funnel[0].n)}%</em>
              </div>
            ))}
          </div>
          {users.length - reg.length > 0 && (
            <button className="adm-note mt-6" onClick={() => onPick('incomplete')}>
              + {users.length - reg.length} account con registrazione incompleta (solo email, senza ospedale e profilo) <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </section>

        <section className="adm-panel p-7 lg:col-span-2">
          <h3 className="adm-h3">Profili</h3>
          <p className="adm-sub mb-5">Percorso scelto alla registrazione</p>
          <div className="adm-split"><i style={{ width: `${pct(adulti, reg.length)}%` }} /></div>
          <div className="flex justify-between mt-3 text-sm text-white/70">
            <span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-[#FF8731]" /> Adulti <b className="text-white">{adulti}</b></span>
            <span className="flex items-center gap-2">Pediatria <b className="text-white">{reg.length - adulti}</b> <Baby className="w-4 h-4 text-[#B39BFF]" /></span>
          </div>
          <div className="adm-hr" />
          <h3 className="adm-h3">Verifica finale</h3>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <button className="adm-mini" onClick={() => onPick('cert')}><b className="text-emerald-300">{cert}</b><span>superata</span></button>
            <button className="adm-mini" onClick={() => onPick('quiz')}><b className="text-[#B39BFF]">{by('quiz')}</b><span>da fare</span></button>
            <button className="adm-mini" onClick={() => onPick('retry')}><b className="text-amber-300">{by('retry')}</b><span>da ritentare</span></button>
          </div>
        </section>
      </div>

      <section className="adm-panel p-7">
        <h3 className="adm-h3">Dove si fermano</h3>
        <p className="adm-sub mb-6">Per chi non è ancora certificato: la prossima tappa che deve fare</p>
        <div className="grid lg:grid-cols-2 gap-10">
          {stuck.map(({ p, total, rows }) => {
            const max = Math.max(1, ...rows.map((r) => r.n));
            return (
              <div key={p}>
                <p className="text-sm font-bold text-white/80 mb-3">{p === 'adulti' ? 'Adulti' : 'Pediatria'} · {total} {total === 1 ? 'operatore' : 'operatori'}</p>
                <div className="space-y-1.5">
                  {rows.map((r) => (
                    <div key={r.i} className="adm-stuck">
                      <span className="adm-stuck-n">{r.i === 'q' ? <Award className="w-3.5 h-3.5" /> : r.i + 1}</span>
                      <span className="adm-stuck-t">{r.title}</span>
                      <div className="adm-stuck-bar"><i style={{ width: `${(r.n / max) * 100}%` }} className={r.n === max && r.n > 0 ? 'top' : ''} /></div>
                      <b>{r.n}</b>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="adm-panel p-7">
        <h3 className="adm-h3">Andamento</h3>
        <p className="adm-sub mb-4">Nuovi iscritti e certificati, settimana per settimana (ultime 12)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeks} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF8731" stopOpacity={0.5} /><stop offset="100%" stopColor="#FF8731" stopOpacity={0} /></linearGradient>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3FC48C" stopOpacity={0.5} /><stop offset="100%" stopColor="#3FC48C" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,.4)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke="rgba(255,255,255,.4)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#0E1736', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="Iscritti" stroke="#FF8731" strokeWidth={2.5} fill="url(#gI)" />
              <Area type="monotone" dataKey="Certificati" stroke="#3FC48C" strokeWidth={2.5} fill="url(#gC)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

/* ---------------- OPERATORI ---------------- */
const Operators = ({ users, actions, status, setStatus, hosp, setHosp }) => {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState(['lastLogin', 'desc']);
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(1);

  const hospitals = [...new Set(users.map((u) => u.hospital).filter(Boolean))].sort();
  const rows = users
    .filter((u) => status === 'all' || u.status === status || (status === 'quiz' && u.status === 'retry'))
    .filter((u) => hosp === 'all' || u.hospital === hosp)
    .filter((u) => !q || [u.name, u.email, u.hospital, u.department].some((x) => (x || '').toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => {
      const [k, d] = sort; const m = d === 'asc' ? 1 : -1;
      if (k === 'name') return m * (a.name || '').localeCompare(b.name || '');
      if (k === 'progress') return m * (a.pct - b.pct);
      if (k === 'hospital') return m * (a.hospital || '').localeCompare(b.hospital || '');
      return m * (new Date(a.lastLogin || 0) - new Date(b.lastLogin || 0));
    });
  useEffect(() => { setPage(1); setOpen(null); }, [q, hosp, status, sort]);
  const pages = Math.ceil(rows.length / PER_PAGE);
  const view = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const sortBy = (k) => setSort(([sk, sd]) => [k, sk === k && sd === 'asc' ? 'desc' : 'asc']);
  const Th = ({ k, children }) => (
    <th><button onClick={() => sortBy(k)} className="flex items-center gap-1.5">{children}<ArrowUpDown className={`w-3 h-3 ${sort[0] === k ? 'text-[#FF8731]' : ''}`} /></button></th>
  );
  const filtered = status !== 'all' || hosp !== 'all' || q;

  const exportCSV = () => download(
    `Lemons_operatori_${hosp !== 'all' ? hosp.replace(/[^\w]+/g, '_') + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`,
    ['Operatore', 'Email', 'Telefono', 'Ospedale', 'Reparto', 'Profilo', 'Tablet', 'Tappe fatte', 'Stato', 'Miglior punteggio verifica', 'Data certificato', 'Newsletter', 'Accessi', 'Primo accesso', 'Ultimo accesso'],
    rows.map((u) => [u.name, u.email, u.phone, u.hospital, u.department, u.patientType ? (profileOf(u.patientType) === 'pediatria' ? 'Pediatria' : 'Adulti') : '', u.usesTablet ? 'Sì' : 'No',
      u.patientType ? `${u.doneCount}/${u.total}` : '', STATUS[u.status].label, u.quizBest ?? '', itDate(u.quizPassedAt), u.newsletterOptIn === true ? 'Sì' : u.newsletterOptIn === false ? 'No' : '—',
      u.loginCount || 1, itDate(u.firstLogin), itDate(u.lastLogin, true)]),
  );

  return (
    <section className="adm-panel overflow-hidden">
      <div className="p-7 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <h3 className="adm-h3">Operatori</h3>
          <p className="adm-sub">
            {filtered ? `${rows.length} di ${users.length}` : `${users.length} operatori`}
            {filtered && <button onClick={() => { setStatus('all'); setHosp('all'); setQ(''); }} className="ml-3 text-[#FF8731] font-bold inline-flex items-center gap-1"><X className="w-3 h-3" /> Togli i filtri</button>}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={hosp} onChange={(e) => setHosp(e.target.value)} className="adm-input max-w-[280px]">
            <option value="all">Tutti gli ospedali</option>
            {hospitals.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="adm-input">
            <option value="all">Tutti gli stati</option>
            {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca nome, email, reparto…" className="adm-input !pl-10 w-64" />
          </div>
          <button onClick={exportCSV} className="adm-btn"><Download className="w-4 h-4" /> Esporta CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="adm-table">
          <thead>
            <tr><Th k="name">Operatore</Th><Th k="hospital">Ospedale</Th><Th k="progress">Formazione</Th><Th k="lastLogin">Ultimo accesso</Th><th /></tr>
          </thead>
          <tbody>
            {view.length === 0 && <tr><td colSpan={5} className="py-14 text-center text-white/50">Nessun operatore con questi filtri.</td></tr>}
            {view.map((u) => {
              const isOpen = open === u.id;
              const lessons = u.patientType ? LESSONS[profileOf(u.patientType)] : [];
              return (
                <React.Fragment key={u.id}>
                  <tr className={`cursor-pointer ${isOpen ? 'is-open' : ''}`} onClick={() => setOpen(isOpen ? null : u.id)}>
                    <td>
                      <div className="flex items-center gap-3.5">
                        <div className="adm-avatar">{(u.firstName?.[0] || u.name?.[0] || '?').toUpperCase()}{(u.lastName?.[0] || '').toUpperCase()}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                            {u.name}
                            {u.isAdmin && <span className="adm-tag tag-violet">Admin</span>}
                            {u.internal && <span className="adm-tag">Interno / prova</span>}
                          </div>
                          <div className="text-xs text-white/45 truncate max-w-[260px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-semibold text-white/85 max-w-[300px]">{u.hospital || '—'}</div>
                      <div className="text-xs text-white/45">{u.department || ''}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.patientType && (
                          <div className="adm-dots" title={`${u.doneCount}/${u.total} tappe`}>
                            {lessons.map((l) => <i key={l.id} className={u.done.includes(l.id) ? 'on' : ''} />)}
                          </div>
                        )}
                        <Badge s={u.status} />
                      </div>
                      <div className="text-xs text-white/45 mt-1.5 flex items-center gap-2">
                        {u.patientType && <span>{profileOf(u.patientType) === 'pediatria' ? 'Pediatria' : 'Adulti'} · {u.doneCount}/{u.total} tappe</span>}
                        {u.usesTablet && <span className="adm-tag tag-sky">Tablet</span>}
                        {u.quizBest != null && !u.quizPassedAt && <span>· miglior verifica {u.quizBest}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-white/80">{timeAgo(u.lastLogin)}</div>
                      <div className="text-xs text-white/45">{u.loginCount || 1} accessi</div>
                    </td>
                    <td className="text-right">{isOpen ? <ChevronUp className="w-5 h-5 inline text-white/50" /> : <ChevronDown className="w-5 h-5 inline text-white/50" />}</td>
                  </tr>
                  {isOpen && (
                    <tr className="adm-detail">
                      <td colSpan={5}>
                        <div className="grid md:grid-cols-3 gap-8 p-6">
                          <div>
                            <p className="adm-label">Contatti</p>
                            <dl className="adm-dl">
                              <dt>Email</dt><dd>{u.email || '—'}</dd>
                              <dt>Telefono</dt><dd>{u.phone || '—'}</dd>
                              <dt>Newsletter</dt><dd>{u.newsletterOptIn === true ? 'Iscritto' : u.newsletterOptIn === false ? 'Ha rifiutato' : 'Non ha risposto'}</dd>
                              <dt>Primo accesso</dt><dd>{itDate(u.firstLogin)}</dd>
                              <dt>Ultimo accesso</dt><dd>{itDate(u.lastLogin, true)}</dd>
                              <dt>Onboarding già fatto</dt><dd>{u.priorOnboarding === true ? 'Sì' : u.priorOnboarding === false ? 'No' : '—'}</dd>
                            </dl>
                          </div>
                          <div>
                            <p className="adm-label">Tappe</p>
                            {u.patientType ? (
                              <ol className="adm-steps">
                                {lessons.map((l, i) => <li key={l.id} className={u.done.includes(l.id) ? 'on' : ''}><span>{u.done.includes(l.id) ? <Check className="w-3 h-3" /> : i + 1}</span>{l.title}</li>)}
                                <li className={u.quizPassedAt ? 'on' : ''}><span>{u.quizPassedAt ? <Check className="w-3 h-3" /> : <Award className="w-3 h-3" />}</span>Verifica finale{u.quizPassedAt ? ` · ${itDate(u.quizPassedAt)}` : u.quizBest != null ? ` · miglior ${u.quizBest}` : ''}</li>
                              </ol>
                            ) : <p className="text-sm text-white/50">Non ha completato la registrazione (profilo, ospedale e reparto mancanti).</p>}
                          </div>
                          <div>
                            <p className="adm-label">Azioni</p>
                            <div className="flex flex-col gap-2 items-start">
                              <button onClick={() => actions.reset(u)} className="adm-act act-amber"><RotateCcw className="w-3.5 h-3.5" /> Azzera il percorso</button>
                              {u.patientType && <button onClick={() => actions.unlock(u)} className="adm-act act-green"><Unlock className="w-3.5 h-3.5" /> Segna tutte le tappe come fatte</button>}
                              <button onClick={() => actions.admin(u)} className="adm-act act-violet">{u.isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}{u.isAdmin ? 'Togli accesso admin' : 'Rendi admin'}</button>
                              <button onClick={() => actions.remove(u)} className="adm-act act-red"><Trash2 className="w-3.5 h-3.5" /> Elimina operatore</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="p-5 flex items-center justify-between text-sm text-white/50">
          <span>{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, rows.length)} di {rows.length}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="adm-btn !px-2.5 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`adm-btn !px-3 ${n === page ? '!bg-[#FF8731] !text-white' : ''}`}>{n}</button>
            ))}
            <button disabled={page === pages} onClick={() => setPage(page + 1)} className="adm-btn !px-2.5 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </section>
  );
};

/* ---------------- OSPEDALI ---------------- */
const Hospitals = ({ users, onOpenHospital }) => {
  const [open, setOpen] = useState(null);
  const groups = Object.values(users.filter((u) => u.hospital).reduce((acc, u) => {
    (acc[u.hospital] ||= { name: u.hospital, users: [] }).users.push(u); return acc;
  }, {})).map((h) => ({
    ...h,
    deps: Object.values(h.users.reduce((acc, u) => {
      const k = (u.department || '—').trim();
      (acc[k.toLowerCase()] ||= { name: k, users: [] }).users.push(u); return acc;
    }, {})).sort((a, b) => b.users.length - a.users.length),
  })).sort((a, b) => b.users.length - a.users.length);
  const cnt = (list) => ({
    tot: list.length,
    cert: list.filter((u) => u.status === 'cert').length,
    quiz: list.filter((u) => u.status === 'quiz' || u.status === 'retry').length,
    prog: list.filter((u) => u.status === 'progress').length,
    nuovo: list.filter((u) => u.status === 'new').length,
  });
  const Cells = ({ c }) => (
    <>
      <td className="text-center font-bold text-white">{c.tot}</td>
      <td className="text-center text-emerald-300 font-semibold">{c.cert}</td>
      <td className="text-center text-[#B39BFF] font-semibold">{c.quiz}</td>
      <td className="text-center text-[#FFB070] font-semibold">{c.prog}</td>
      <td className="text-center text-white/50">{c.nuovo}</td>
      <td><div className="flex items-center gap-3"><div className="adm-meter"><i style={{ width: `${pct(c.cert, c.tot)}%` }} /></div><b className="text-sm text-white w-10">{pct(c.cert, c.tot)}%</b></div></td>
    </>
  );
  const exportCSV = () => download(`Lemons_ospedali_${new Date().toISOString().slice(0, 10)}.csv`,
    ['Ospedale', 'Reparto', 'Operatori', 'Certificati', 'Verifica da fare', 'In formazione', 'Non iniziato', 'Certificati %'],
    groups.flatMap((h) => h.deps.map((d) => { const c = cnt(d.users); return [h.name, d.name, c.tot, c.cert, c.quiz, c.prog, c.nuovo, `${pct(c.cert, c.tot)}%`]; })));
  return (
    <div className="space-y-6">
      <section className="adm-panel overflow-hidden">
        <div className="p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h3 className="adm-h3">Ospedali e reparti</h3>
            <p className="adm-sub">{groups.length} ospedali · clicca un ospedale per vedere i suoi reparti</p>
          </div>
          <button onClick={exportCSV} className="adm-btn self-start"><Download className="w-4 h-4" /> Esporta CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="adm-table">
            <thead><tr><th>Ospedale / reparto</th><th className="!text-center">Operatori</th><th className="!text-center">Certificati</th><th className="!text-center">Verifica da fare</th><th className="!text-center">In formazione</th><th className="!text-center">Non iniziato</th><th>Certificati %</th><th /></tr></thead>
            <tbody>
              {groups.length === 0 && <tr><td colSpan={8} className="py-14 text-center text-white/50">Nessun operatore registrato.</td></tr>}
              {groups.map((h) => (
                <React.Fragment key={h.name}>
                  <tr className={`cursor-pointer ${open === h.name ? 'is-open' : ''}`} onClick={() => setOpen(open === h.name ? null : h.name)}>
                    <td><div className="flex items-center gap-3 font-bold text-white">{open === h.name ? <ChevronUp className="w-4 h-4 text-[#FF8731] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#FF8731] shrink-0" />}{h.name}</div></td>
                    <Cells c={cnt(h.users)} />
                    <td className="text-right whitespace-nowrap">
                      <button onClick={(e) => { e.stopPropagation(); onOpenHospital(h.name); }} className="adm-link">Vedi operatori <ExternalLink className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                  {open === h.name && h.deps.map((d) => (
                    <tr key={d.name} className="adm-sub-row">
                      <td><span className="pl-7 text-white/75">{d.name}</span></td>
                      <Cells c={cnt(d.users)} /><td />
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <CatalogSection />
    </div>
  );
};

/* ---------------- EMAIL ---------------- */
const EMAIL_FILTERS = [['all', 'Tutti'], ['accepted', 'Iscritti'], ['refused', 'Hanno rifiutato'], ['pending', 'Non hanno risposto']];
const MAIL_LABEL = { accepted: 'Iscritto', refused: 'Ha rifiutato', pending: 'Non ha risposto' };
const EmailTab = ({ users }) => {
  const [f, setF] = useState('all');
  const [q, setQ] = useState('');
  const st = (u) => (u.newsletterOptIn === true ? 'accepted' : u.newsletterOptIn === false ? 'refused' : 'pending');
  const withMail = users.filter((u) => u.email);
  const counts = Object.fromEntries(EMAIL_FILTERS.map(([k]) => [k, k === 'all' ? withMail.length : withMail.filter((u) => st(u) === k).length]));
  const rows = withMail.filter((u) => f === 'all' || st(u) === f)
    .filter((u) => !q || `${u.email} ${u.name}`.toLowerCase().includes(q.toLowerCase()));
  const exportCSV = () => download(`Lemons_email_${f}_${new Date().toISOString().slice(0, 10)}.csv`,
    ['Nome', 'Email', 'Telefono', 'Ospedale', 'Newsletter', 'Ultimo accesso'],
    rows.map((u) => [u.name, u.email, u.phone, u.hospital, MAIL_LABEL[st(u)], itDate(u.lastLogin)]));
  return (
    <section className="adm-panel overflow-hidden">
      <div className="p-7 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <h3 className="adm-h3">Email e newsletter</h3>
          <p className="adm-sub">{counts.all} email raccolte · {counts.accepted} iscritti alla newsletter</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {EMAIL_FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setF(k)} className={`adm-chip ${f === k ? 'on' : ''}`}>{l} <span>{counts[k]}</span></button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca…" className="adm-input w-44" />
          <button onClick={exportCSV} className="adm-btn"><Download className="w-4 h-4" /> Esporta CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="adm-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Telefono</th><th>Ospedale</th><th>Newsletter</th><th>Ultimo accesso</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-14 text-center text-white/50">Nessun risultato.</td></tr>}
            {rows.map((u) => (
              <tr key={u.id}>
                <td className="font-bold text-white">{u.name}</td>
                <td className="text-white/80">{u.email}</td>
                <td className="text-white/50">{u.phone || '—'}</td>
                <td className="text-white/50 max-w-[260px]">{u.hospital || '—'}</td>
                <td><span className={`adm-badge ${st(u) === 'accepted' ? 'st-cert' : st(u) === 'refused' ? 'st-red' : 'st-new'}`}>{MAIL_LABEL[st(u)]}</span></td>
                <td className="text-white/50">{itDate(u.lastLogin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/* ---------------- PAGINA ---------------- */
const TABS = [
  ['panoramica', 'Panoramica', LayoutDashboard],
  ['operatori', 'Operatori', Users],
  ['ospedali', 'Ospedali', Building2],
  ['chatbot', 'Chatbot', MessageCircle],
  ['email', 'Email', Mail],
];
const tabFromHash = () => { const h = window.location.hash.slice(1); return TABS.some(([k]) => k === h) ? h : 'panoramica'; };

const Admin = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [all, setAll] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);
  const [tab, setTab] = useState(tabFromHash);
  const [showInternal, setShowInternal] = useState(false);
  const [opStatus, setOpStatus] = useState('all');
  const [opHosp, setOpHosp] = useState('all');
  const [modal, setModal] = useState({ open: false });

  useEffect(() => { if (authed) window.history.replaceState(null, '', `#${tab}`); window.scrollTo({ top: 0 }); }, [tab, authed]);

  const load = async () => {
    const { data, error } = await supabase.from('users').select('*').order('last_login', { ascending: false });
    if (error) { alert(error.message); return; }
    setAll((data || []).map((u) => {
      const lessons = u.patient_type ? LESSONS[profileOf(u.patient_type)] : [];
      const done = (u.completed_modules || []).filter((id) => lessons.some((l) => l.id === id));
      const x = {
        id: u.id, isAdmin: !!u.is_admin, name: u.name, firstName: u.first_name, lastName: u.last_name,
        email: u.email, phone: u.phone, hospital: u.hospital, department: u.department, patientType: u.patient_type,
        loginCount: u.login_count, firstLogin: u.first_login, lastLogin: u.last_login,
        done, doneCount: done.length, total: lessons.length || 1, nextIdx: lessons.findIndex((l) => !done.includes(l.id)),
        pct: lessons.length ? Math.round((done.length / lessons.length) * 100) + (u.final_quiz_passed_at ? 1 : 0) : -1,
        newsletterOptIn: u.newsletter_opt_in, quizPassedAt: u.final_quiz_passed_at, quizBest: u.final_quiz_best_score,
        usesTablet: !!u.uses_tablet, priorOnboarding: u.prior_onboarding,
      };
      x.internal = isInternal(x);
      x.status = statusOf(x);
      return x;
    }));
    setLoadedAt(new Date());
  };

  const enterIfAdmin = async () => {
    const { data: ok, error } = await supabase.rpc('is_admin');
    if (error || !ok) return false;
    setAuthed(true); load(); return true;
  };
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data?.session) enterIfAdmin(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginError(''); setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError('Email o password errati.'); setLoginLoading(false); return; }
    if (!(await enterIfAdmin())) { await supabase.auth.signOut(); setLoginError('Questo account non ha i permessi di amministratore.'); }
    setLoginLoading(false);
  };
  const exit = async () => { await supabase.auth.signOut(); localStorage.removeItem('lemo_user'); navigate('/'); };

  const users = useMemo(() => all.filter((u) => showInternal || !u.internal), [all, showInternal]);
  const internalCount = all.filter((u) => u.internal).length;

  const ask = (title, message, run, danger = true) => setModal({
    open: true, title, message, danger,
    onConfirm: async () => { const { error } = await run(); if (error) alert(error.message); setModal({ open: false }); load(); },
  });
  const actions = {
    reset: (u) => ask('Azzera il percorso', `Riportare "${u.name}" all'inizio? Tappe e verifica vengono azzerate, l'account resta.`,
      () => supabase.from('users').update({ completed_modules: [], final_quiz_passed_at: null, final_quiz_best_score: null }).eq('id', u.id), false),
    unlock: (u) => ask('Segna tutte le tappe come fatte', `Segnare come fatte tutte le tappe di "${u.name}"? Per il certificato dovrà comunque superare la verifica finale.`,
      () => supabase.from('users').update({ completed_modules: LESSONS[profileOf(u.patientType)].map((l) => l.id) }).eq('id', u.id), false),
    admin: (u) => ask(u.isAdmin ? 'Togli accesso admin' : 'Rendi admin',
      u.isAdmin ? `Togliere a "${u.name}" l'accesso a questa dashboard?` : `Dare a "${u.name}" l'accesso a questa dashboard? Vedrà i dati di tutti gli operatori e potrà modificarli.`,
      () => supabase.from('users').update({ is_admin: !u.isAdmin }).eq('id', u.id), u.isAdmin),
    remove: (u) => ask('Elimina operatore', `Eliminare definitivamente "${u.name}" e tutti i suoi progressi? L'operazione non si può annullare.`,
      () => supabase.from('users').delete().eq('id', u.id)),
  };
  const goOperators = (status = 'all', hosp = 'all') => { setOpStatus(status); setOpHosp(hosp); setTab('operatori'); };

  if (!authed) {
    return (
      <div className="adm min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="adm-panel p-10 w-full max-w-md text-center relative z-10">
          <img src="/images/logos/logo bianco panna png.png" alt="Lemons in the room" className="w-16 h-16 mx-auto mb-6 object-contain" />
          <h1 className="adm-h1 !text-3xl mb-2">Area riservata</h1>
          <p className="text-white/55 mb-8">Accesso riservato al team Lemons in the room.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="adm-input w-full !py-3.5 text-center" />
            <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="adm-input w-full !py-3.5 text-center" />
            {loginError && <p className="text-red-400 text-sm font-semibold">{loginError}</p>}
            <button type="submit" disabled={loginLoading} className="adm-primary w-full justify-center !py-3.5">{loginLoading ? '…' : 'Entra'}</button>
          </form>
          <button onClick={() => navigate('/')} className="mt-6 text-white/45 hover:text-white text-sm font-bold">Torna alla piattaforma</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="adm min-h-screen">
      <ConfirmModal {...modal} onCancel={() => setModal({ open: false })} />
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pb-24 relative z-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pt-8 pb-6">
          <div className="flex items-center gap-4">
            <img src="/images/logos/logo bianco panna png.png" alt="Lemons in the room" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="adm-h1">Dashboard formazione</h1>
              <p className="text-white/50 text-sm">{loadedAt ? `Dati aggiornati alle ${loadedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}` : 'Caricamento…'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => setShowInternal((v) => !v)} className={`adm-btn ${showInternal ? 'is-on' : ''}`} title="Account del team Lemons e account di prova">
              {showInternal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showInternal ? 'Account interni inclusi' : `Account interni esclusi (${internalCount})`}
            </button>
            <button onClick={load} className="adm-btn"><RefreshCw className="w-4 h-4" /> Aggiorna</button>
            <button onClick={() => navigate('/home')} className="adm-btn">Piattaforma</button>
            <button onClick={exit} className="adm-btn"><LogOut className="w-4 h-4" /> Esci</button>
          </div>
        </header>

        <nav className="adm-tabs" role="tablist">
          {TABS.map(([k, l, I]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={tab === k ? 'on' : ''}>
              {tab === k && <motion.span layoutId="admTab" className="adm-tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
              <I className="w-4 h-4" /> <span>{l}</span>
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="pt-6">
            {tab === 'panoramica' && <Overview users={users} onPick={(s) => goOperators(s)} />}
            {tab === 'operatori' && <Operators users={users} actions={actions} status={opStatus} setStatus={setOpStatus} hosp={opHosp} setHosp={setOpHosp} />}
            {tab === 'ospedali' && <Hospitals users={users} onOpenHospital={(h) => goOperators('all', h)} />}
            {tab === 'chatbot' && <KnowledgeSection />}
            {tab === 'email' && <EmailTab users={users} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Admin;
