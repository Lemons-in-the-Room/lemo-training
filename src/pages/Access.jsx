import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { supabase } from '../utils/supabase';
import { fmt } from '../i18n/ui';
import { Ico, IMG, World } from '../imm/kit';
import { LangMenu } from '../Layout';
import '../styles/immersive.css';
import '../styles/immersive-extra.css';

const OTHER = '__other__';

// Elenco da tabella catalog_options (solo voci approvate) + "Altro"
function Pick({ label, kind, value, onChange, placeholder, options, otherLabel, otherPh }) {
  const known = options.includes(value);
  const [mode, setMode] = useState(value && !known ? OTHER : value || '');
  return (
    <div className="fld">
      <span>{label}</span>
      <div className="sel">
        <select
          value={mode}
          onChange={(e) => { const v = e.target.value; setMode(v); onChange(v === OTHER ? '' : v); }}
          aria-label={label} required data-kind={kind}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          <option value={OTHER}>{otherLabel}</option>
        </select>
        <Ico n="down" />
      </div>
      {mode === OTHER && (
        <input autoFocus required minLength={2} maxLength={120} value={value} onChange={(e) => onChange(e.target.value)} placeholder={otherPh} aria-label={`${label}: ${otherLabel}`} />
      )}
    </div>
  );
}

export default function Access() {
  const { t, u } = useLang();
  const w = t.welcome;
  const A = u.access;
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState({ text: '', ok: false });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [f, setF] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', hospital: '', department: '', patientType: '' });
  const [lists, setLists] = useState({ hospital: [], department: [] });
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
      options: { data: { first_name: f.firstName.trim(), last_name: f.lastName.trim(), phone: f.phone.trim(), hospital: f.hospital.trim(), department: f.department.trim(), patient_type: f.patientType } },
    });
    if (error) { setMsg({ text: /already/i.test(error.message) ? A.errExists : A.errRegister }); setLoading(false); return; }
    if (!data?.session) { setMsg({ text: A.confirmMail, ok: true }); setLoading(false); return; }
    navigate('/home');
  };

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
                  <Pick label={w.hospital} kind="hospital" value={f.hospital} onChange={set('hospital')} placeholder={A.pickHospital} options={lists.hospital} otherLabel={A.other} otherPh={A.otherPh} />
                  <Pick label={w.department} kind="department" value={f.department} onChange={set('department')} placeholder={A.pickDept} options={lists.department} otherLabel={A.other} otherPh={A.otherPh} />
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
                    <button className="btn btn-accent big" disabled={loading || !f.hospital.trim() || !f.department.trim() || !f.patientType}>{loading ? '…' : A.create} <Ico n="arrow" /></button>
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
