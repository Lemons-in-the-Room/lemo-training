import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../LanguageContext';
import { supabase } from '../utils/supabase';
import { Ico, IMG, World } from '../imm/kit';
import { LangMenu } from '../Layout';
import '../styles/immersive.css';
import '../styles/immersive-extra.css';

// "Scegli la nuova password": qui arriva il link della mail di recupero (redirectTo = /reset-password).
// Il client Supabase legge il link e apre una sessione temporanea (evento PASSWORD_RECOVERY):
// l'operatore scrive la password due volte, si salva con updateUser e si entra nella piattaforma.
const clearFlags = () => { sessionStorage.removeItem('lemo_recovery'); sessionStorage.removeItem('lemo_auth_error'); };

export default function ResetPassword() {
  const { t, u } = useLang();
  const w = t.welcome;
  const R = u.reset;
  const navigate = useNavigate();
  const [state, setState] = useState('checking'); // checking | ready | invalid | done
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (alive && session && event === 'PASSWORD_RECOVERY') setState((s) => (s === 'done' ? s : 'ready'));
    });
    // getSession aspetta che il client abbia letto il link: se non c'è una sessione, il link non vale (o è scaduto)
    // link scaduto o già usato: lo dice Supabase nell'indirizzo, anche se nel browser c'è già una sessione
    const expired = sessionStorage.getItem('lemo_auth_error') && !sessionStorage.getItem('lemo_recovery');
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState((s) => (s !== 'checking' ? s : !expired && data?.session ? 'ready' : 'invalid'));
    });
    return () => { alive = false; sub?.subscription?.unsubscribe(); };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    if (pwd.length < 6) { setErr(R.errShort); return; }
    if (pwd !== pwd2) { setErr(R.errMatch); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setLoading(false);
      const code = error.code || '';
      setErr(code === 'same_password' || /different/i.test(error.message) ? R.errSame : code === 'weak_password' ? R.errShort : R.errGeneric);
      return;
    }
    clearFlags();
    // conta come un accesso, come il login normale
    const uid = data?.user?.id;
    if (uid) {
      const { data: p } = await supabase.from('users').select('login_count').eq('id', uid).maybeSingle();
      await supabase.from('users').update({ login_count: (p?.login_count || 0) + 1, last_login: new Date().toISOString() }).eq('id', uid);
    }
    setState('done');
    setTimeout(() => navigate('/home', { replace: true }), 1600);
  };

  const back = async () => { clearFlags(); await supabase.auth.signOut().catch(() => {}); navigate('/', { replace: true }); };

  const eye = <button type="button" aria-label={R.password} aria-pressed={show} onClick={() => setShow((v) => !v)}><Ico n="eye" /></button>;

  return (
    <div className="imm access">
      <World scenes={[{ video: IMG.raft, videoM: IMG.raftM, poster: IMG.raftPoster, dim: 0.3 }]} />
      <header className="top">
        <span className="brand"><img src={IMG.logo} alt="Lemons in the Room" width="150" height="30" /></span>
        <div className="acc-tools"><LangMenu /></div>
      </header>
      <main className="acc-wrap">
        <div className="acc-hero">
          <h1 className="split"><span>{w.tagline.trim()}</span> <span className="accent">{w.taglineAccent}</span></h1>
        </div>

        <div className="acc-card">
          {state === 'checking' && <p className="lead" role="status">{R.checking}</p>}

          {state === 'invalid' && (
            <div className="acc-form">
              <h2 className="reset-h">{R.invalidTitle}</h2>
              <p className="reset-p">{R.invalidText}</p>
              <button type="button" className="btn btn-accent big wide" onClick={back}><Ico n="back" /> {R.back}</button>
            </div>
          )}

          {(state === 'ready' || state === 'done') && (
            <form onSubmit={save} className="acc-form">
              <h2 className="reset-h">{R.title}</h2>
              <p className="reset-p">{R.lead}</p>
              <label className="fld"><span>{R.password} <em>{R.hint}</em></span>
                <div className="pwd">
                  <input type={show ? 'text' : 'password'} required minLength={6} autoComplete="new-password" autoFocus value={pwd} onChange={(e) => setPwd(e.target.value)} disabled={state === 'done'} />
                  {eye}
                </div>
              </label>
              <label className="fld"><span>{R.confirm}</span>
                <div className="pwd">
                  <input type={show ? 'text' : 'password'} required minLength={6} autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} disabled={state === 'done'} />
                </div>
              </label>
              {err && <p className="form-err" role="alert">{err}</p>}
              {state === 'done' && <p className="form-ok" role="status">{R.ok}</p>}
              <button className="btn btn-accent big wide" disabled={loading || state === 'done'}>{loading ? '…' : R.save} <Ico n="arrow" /></button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
