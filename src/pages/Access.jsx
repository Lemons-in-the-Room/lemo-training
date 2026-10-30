import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { supabase } from '../utils/supabase';
import { fmt } from '../i18n/ui';
import { Ico, IMG, World } from '../imm/kit';
import { LangMenu } from '../Layout';
import '../styles/immersive.css';
import '../styles/immersive-extra.css';

const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');

// Campo con ricerca: si scrive, si sceglie dall'elenco; se manca si usa quello scritto (finisce "da approvare" in Admin).
function Search({ label, items, value, onChange, placeholder, A, id }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const results = useMemo(() => {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length) return items.slice(0, 50);
    const out = [];
    for (const it of items) {
      if (toks.every((t) => it.k.includes(t))) { out.push(it); if (out.length >= 50) break; }
    }
    return out;
  }, [q, items]);
  const typed = q.trim();
  const showTyped = typed.length >= 2 && !results.some((r) => norm(r.v) === norm(typed));
  const options = [...results.map((r) => ({ ...r, kind: 'item' })), ...(showTyped ? [{ v: typed, kind: 'typed' }] : [])];

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' }); }, [hi]);

  const pick = (o) => { onChange(o.v, o.kind === 'typed'); setQ(''); setOpen(false); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && open && options[hi]) { e.preventDefault(); pick(options[hi]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  if (value.v) {
    return (
      <div className="fld"><span>{label}</span>
        <div className="picked">
          <div><b>{value.v}</b>{value.typed && <em>{A.typed}</em>}</div>
          <button type="button" className="link" onClick={() => onChange('', false)}>{A.change}</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fld" ref={boxRef}>
      <label htmlFor={id}>{label}</label>
      <div className="combo">
        <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-l`} aria-autocomplete="list" autoComplete="off"
          value={q} placeholder={placeholder} required
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }} onFocus={() => setOpen(true)} onKeyDown={onKey} />
        <Ico n="down" />
        {open && options.length > 0 && (
          <ul className="combo-list" role="listbox" id={`${id}-l`} ref={listRef}>
            {options.map((o, k) => (
              <li key={o.kind + o.v} role="option" aria-selected={k === hi} className={o.kind === 'typed' ? 'typed' : ''}
                onPointerDown={(e) => { e.preventDefault(); pick(o); }} onPointerEnter={() => setHi(k)}>
                {o.kind === 'typed' ? fmt(A.useTyped, { q: o.v }) : <><b>{o.n}</b>{o.sub && <span>{o.sub}</span>}</>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Access() {
  const { t, u, lang } = useLang();
  const w = t.welcome;
  const A = u.access;
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [f, setF] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', patientType: '' });
  const [hosp, setHosp] = useState({ v: '', typed: false });
  const [dep, setDep] = useState({ v: '', typed: false });
  const [lists, setLists] = useState({ hospital: [], department: [] });
  const [official, setOfficial] = useState([]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: typeof e === 'string' ? e : e.target.value }));

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive && data?.session) navigate('/home', { replace: true }); });
    supabase.from('catalog_options').select('kind,name,sort').eq('approved', true).order('sort').order('name').then(({ data }) => {
      if (!alive || !data) return;
      setLists({ hospital: data.filter((r) => r.kind === 'hospital').map((r) => r.name), department: data.filter((r) => r.kind === 'department').map((r) => r.name) });
    });
    return () => { alive = false; };
  }, [navigate]);

  // elenchi ufficiali (Italia, Ministero della Salute 2023; Spagna, Catálogo Nacional de Hospitales 2025):
  // si scaricano solo quando l'operatore arriva al passo con ospedale e reparto
  useEffect(() => {
    if (step !== 2 || official.length) return undefined;
    let alive = true;
    fetch('/ospedali.json').then((r) => r.json()).then((d) => { if (alive) setOfficial(d); }).catch(() => {});
    return () => { alive = false; };
  }, [step, official.length]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ text: '' });
    const { data, error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    if (error) { setMsg({ text: A.errLogin }); setLoading(false); return; }
    const uid = data.user.id;
    const { data: p } = await supabase.from('users').select('login_count').eq('id', uid).maybeSingle();
    await supabase.from('users').update({ login_count: (p?.login_count || 0) + 1, last_login: new Date().toISOString() }).eq('id', uid);
    navigate('/home');
  };

  const register = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true); setMsg({ text: '' });
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { first_name: f.firstName.trim(), last_name: f.lastName.trim(), phone: f.phone.trim(), hospital: hosp.v.trim(), department: dep.v.trim(), hospital_custom: hosp.typed, department_custom: dep.typed, patient_type: f.patientType } },
    });
    if (error) { setMsg({ text: /already/i.test(error.message) ? A.errExists : A.errRegister }); setLoading(false); return; }
    if (!data?.session) { setMsg({ text: A.confirmMail, ok: true }); setLoading(false); return; }
    navigate('/home');
  };

  const hospitalItems = useMemo(() => {
    const home = lang === 'es' ? 'ES' : 'IT'; // prima gli ospedali del paese della lingua scelta
    const off = official.map((o) => {
      const x = o.x || 'IT';
      const sub = x === 'ES' ? `${o.c}, ${o.p} · España` : `${o.c} (${o.p})`;
      return { v: `${o.n} — ${sub}`, n: o.n, sub, x, k: norm(`${o.n} ${o.c} ${o.p} ${o.a || ''} ${x === 'ES' ? 'spagna espana spain' : ''}`) };
    }).sort((a, b) => (a.x === home ? 0 : 1) - (b.x === home ? 0 : 1));
    const extra = lists.hospital.map((h) => ({ v: h, n: h, sub: '', k: norm(h) }));
    return [...extra, ...off];
  }, [official, lists.hospital, lang]);
  const deptItems = useMemo(() => lists.department.map((d) => ({ v: d, n: d, sub: '', k: norm(d) })), [lists.department]);

  const forgot = async () => {
    if (!f.email.trim()) { setMsg({ text: A.needEmail }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim());
    setMsg(error ? { text: A.resetErr } : { text: A.resetSent, ok: true });
    setLoading(false);
  };

  const pwd = (
    <label className="fld"><span>{A.password}</span>
      <div className="pwd">
        <input type={showPwd ? 'text' : 'password'} required minLength={6} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} placeholder={tab === 'login' ? '' : A.pwdHint} />
        <button type="button" aria-label={A.password} aria-pressed={showPwd} onClick={() => setShowPwd((v) => !v)}><Ico n="eye" /></button>
      </div>
    </label>
  );

  return (
    <div className="imm access">
      <World scenes={[{ video: IMG.heroVideo, poster: IMG.heroPoster, dim: 0.35 }]} />
      <header className="top">
        <span className="brand"><img src={IMG.logo} alt="Lemons in the Room" width="150" height="30" /></span>
        <div className="acc-tools"><LangMenu /></div>
      </header>
      <main className="acc-wrap">
        <div className="acc-hero">
          <h1 className="split"><span>{w.tagline.trim()}</span> <span className="accent">{w.taglineAccent}</span></h1>
          <p className="lead">{w.subtitle.replace('\n', ' ')}</p>
        </div>

        <div className="acc-card">
          <div className="acc-tabs" role="tablist">
            {['login', 'register'].map((k) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setStep(1); setMsg({ text: '' }); }}>{k === 'login' ? A.login : A.register}</button>
            ))}
          </div>

          {tab === 'login' ? (
            <form onSubmit={login} className="acc-form">
              <label className="fld"><span>{w.email}</span><input type="email" required autoComplete="email" value={f.email} onChange={set('email')} placeholder={w.placeholderEmail} /></label>
              {pwd}
              <button type="button" className="link" onClick={forgot}>{A.forgot}</button>
              {msg.text && <p className={msg.ok ? 'form-ok' : 'form-err'} role="alert">{msg.text}</p>}
              <button className="btn btn-accent big wide" disabled={loading}>{loading ? '…' : A.loginBtn} <Ico n="arrow" /></button>
            </form>
          ) : (
            <form onSubmit={register} className="acc-form">
              <p className="kicker">{fmt(A.step, { i: step, n: 2 })}</p>
              {step === 1 ? (
                <>
                  <div className="two">
                    <label className="fld"><span>{w.firstName}</span><input required autoComplete="given-name" value={f.firstName} onChange={set('firstName')} placeholder={w.placeholderFirst} /></label>
                    <label className="fld"><span>{w.lastName}</span><input required autoComplete="family-name" value={f.lastName} onChange={set('lastName')} placeholder={w.placeholderLast} /></label>
                  </div>
                  <label className="fld"><span>{w.email}</span><input type="email" required autoComplete="email" value={f.email} onChange={set('email')} placeholder={w.placeholderEmail} /></label>
                  <label className="fld"><span>{w.phone} <em>{w.phoneOptional}</em></span><input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder={w.placeholderPhone} /></label>
                  {pwd}
                  <button className="btn btn-accent big wide">{A.next} <Ico n="arrow" /></button>
                </>
              ) : (
                <>
                  <Search id="f-hosp" label={w.hospital} items={hospitalItems} value={hosp} onChange={(v, typed) => setHosp({ v, typed })} placeholder={A.searchHospital} A={A} />
                  <Search id="f-dep" label={w.department} items={deptItems} value={dep} onChange={(v, typed) => setDep({ v, typed })} placeholder={A.searchDept} A={A} />
                  <div className="fld"><span>{w.patientProfile}</span>
                    <div className="seg2" role="radiogroup" aria-label={w.patientProfile}>
                      {[['adulti', w.adulti], ['pediatria', w.pediatria]].map(([v, l]) => (
                        <label key={v}><input type="radio" name="pt" required checked={f.patientType === v} onChange={() => setF((s) => ({ ...s, patientType: v }))} /><span>{l}</span></label>
                      ))}
                    </div>
                  </div>
                  {msg.text && <p className={msg.ok ? 'form-ok' : 'form-err'} role="alert">{msg.text}</p>}
                  <div className="acc-row">
                    <button type="button" className="btn btn-line" onClick={() => setStep(1)}><Ico n="back" /> {A.back}</button>
                    <button className="btn btn-accent big" disabled={loading || !hosp.v.trim() || !dep.v.trim() || !f.patientType}>{loading ? '…' : A.create} <Ico n="arrow" /></button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
