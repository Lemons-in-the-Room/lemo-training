import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLang } from './LanguageContext';
import { supabase } from './utils/supabase';
import { AccountProvider, useAccount } from './account';
import ChatWidget from './components/ChatWidget';
import { Ico, IMG, cancelGlide } from './imm/kit';
import './styles/immersive.css';
import './styles/immersive-extra.css';

const LANGS = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export function LangMenu({ up = false, compact = false }) {
  const { lang, switchLang, u } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div className={`lang ${up ? 'up' : ''} ${compact ? 'compact' : ''}`} ref={ref}>
      <button type="button" className="lang-btn" aria-haspopup="listbox" aria-expanded={open} aria-label={u.nav.lang} onClick={() => setOpen((o) => !o)}>
        <Ico n="globe" /><span>{lang.toUpperCase()}</span>
      </button>
      {open && (
        <ul className="lang-menu" role="listbox" aria-label={u.nav.lang}>
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={lang === l.code} onClick={() => { switchLang(l.code); setOpen(false); }}>
                <b>{l.code.toUpperCase()}</b><span>{l.label}</span>{lang === l.code && <Ico n="check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Shell() {
  const { u } = useLang();
  const acc = useAccount();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const onb = pathname.startsWith('/benvenuto');

  useEffect(() => {
    let alive = true;
    supabase.rpc('is_admin').then(({ data }) => { if (alive) setIsAdmin(data === true); });
    return () => { alive = false; };
  }, []);

  // accesso e primo accesso
  useEffect(() => {
    if (acc.status === 'anon') navigate('/', { replace: true });
    else if (acc.needsOnboarding && !onb) navigate('/benvenuto', { replace: true });
    else if (acc.status === 'ready' && !acc.needsOnboarding && onb) navigate('/home', { replace: true });
  }, [acc.status, acc.needsOnboarding, onb, navigate]);

  // barra in alto più scura quando si scorre
  useEffect(() => {
    const el = rootRef.current;
    const f = () => el?.classList.toggle('scrolled', window.scrollY > 30);
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, []);

  useEffect(() => { cancelGlide(); window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);

  const logout = async () => {
    localStorage.removeItem('lemo_user');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const nav = [
    { to: '/home', label: u.nav.home, icon: 'home' },
    { to: '/formazione', label: u.nav.training, icon: 'book', also: ['/verifica'] },
    { to: '/supporto', label: u.nav.support, icon: 'help' },
  ];
  const isCurrent = (n) => pathname.startsWith(n.to) || (n.also || []).some((p) => pathname.startsWith(p));

  return (
    <div className={`imm ${onb ? 'onb-mode' : ''}`} ref={rootRef}>
      <header className="top">
        <NavLink className="brand" to="/home"><img src={IMG.logo} alt="Lemons in the Room" width="150" height="30" /></NavLink>
        <nav className="links" aria-label="Menu">
          {nav.map((n) => <NavLink key={n.to} to={n.to} aria-current={isCurrent(n) ? 'page' : undefined}>{n.label}</NavLink>)}
        </nav>
        <div className="tools">
          {isAdmin && <a href="/admin" className="tool-admin" title={u.nav.admin}><Ico n="shield" /><span>{u.nav.admin}</span></a>}
          <LangMenu />
          <a href="https://www.lemonsintheroom.com" target="_blank" rel="noopener noreferrer" title={u.nav.site} aria-label={u.nav.site}><Ico n="site" /></a>
          <button type="button" className="tool-btn" title={u.nav.logout} aria-label={u.nav.logout} onClick={() => setAskLogout(true)}><Ico n="out" /></button>
        </div>
        <div className="top-mobile">
          {isAdmin && <a href="/admin" className="tool-admin" aria-label={u.nav.admin}><Ico n="shield" /></a>}
          <button type="button" className="tool-btn" aria-label={u.nav.logout} onClick={() => setAskLogout(true)}><Ico n="out" /></button>
        </div>
      </header>

      <main id="view" key={pathname} className="enter">
        {acc.status === 'ready' ? <Outlet /> : <div className="boot" aria-busy="true" />}
      </main>

      <nav className="tabbar" aria-label="Menu">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} aria-current={isCurrent(n) ? 'page' : undefined}><Ico n={n.icon} /><span>{n.label}</span></NavLink>
        ))}
        <LangMenu up compact />
      </nav>

      {!onb && acc.status === 'ready' && <ChatWidget />}

      {askLogout && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="lo-t" onClick={(e) => { if (e.target === e.currentTarget) setAskLogout(false); }}>
          <div className="modal-card">
            <h2 id="lo-t">{u.logout.title}</h2>
            <p>{u.logout.text}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-line" onClick={() => setAskLogout(false)}>{u.logout.no}</button>
              <button type="button" className="btn btn-accent" onClick={logout}><Ico n="out" /> {u.logout.yes}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  return <AccountProvider><Shell /></AccountProvider>;
}
