import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Stethoscope, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, Type, SquareUser, Building2, ChevronDown, Check, Mail, Phone, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useLang } from './LanguageContext';
import { audio } from './utils/audio';
import { supabase } from './utils/supabase';

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' },
  { code: 'en', label: 'English',  flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español',  flag: 'https://flagcdn.com/w40/es.png' },
];

const LangPicker = () => {
  const { lang, switchLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => { audio.playClick(); setOpen(o => !o); }}
        className="flex items-center gap-2.5 pl-4 pr-4 py-3 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-xl border border-white/80 text-[#03091B] text-[15px] font-bold transition-all duration-200 shadow-[0_4px_20px_-4px_rgba(3,9,27,0.2)]"
      >
        <img src={current.flag} alt={current.label} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className={`w-4 h-4 text-[#03091B]/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-full right-0 mt-2 min-w-[180px] bg-[#03091B]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] z-50"
          >
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { audio.playClick(); switchLang(l.code); setOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-semibold transition-colors ${lang === l.code ? 'text-white bg-white/[0.06]' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'}`}
              >
                <img src={l.flag} alt={l.label} className="w-5 h-3.5 object-cover rounded-sm" />
                <span className="flex-1">{l.label}</span>
                {lang === l.code && <Check className="w-3.5 h-3.5 text-[#FF8731]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const capitalize = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

let hospitalsCache = null;
const loadHospitals = async () => {
  if (hospitalsCache) return hospitalsCache;
  const res = await fetch('/hospitals.json');
  hospitalsCache = await res.json();
  return hospitalsCache;
};

const Field = ({ icon: Icon, label, placeholder, value, onChange, accent = '#8756FA', type = 'text', disableCapitalize = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold text-slate-200 uppercase ml-1 tracking-[0.18em]">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-white transition-colors duration-300 z-10" />
        <input
          type={currentType}
          required
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(disableCapitalize || isPassword ? e.target.value : capitalize(e.target.value))}
          placeholder={placeholder}
          style={{ '--accent': accent }}
          className="block w-full pl-9 pr-10 h-10 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-[var(--accent)]/60 rounded-xl text-white text-[13px] font-semibold placeholder-slate-600 outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_0_3px_var(--accent)/0.15,inset_0_1px_2px_rgba(0,0,0,0.4)]"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors z-10"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

const HospitalSearch = ({ value, onChange, placeholder, label }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadHospitals();
    const onClick = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    const list = await loadHospitals();
    const lower = q.toLowerCase();
    const matches = list.filter(h => h.name.toLowerCase().includes(lower)).slice(0, 7);
    setResults(matches);
    setOpen(matches.length > 0);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 150);
  };

  const handleSelect = (item) => {
    setQuery(item.name);
    onChange(item.name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] font-bold text-slate-200 uppercase ml-1 tracking-[0.18em]">{label}</label>}
      <div ref={containerRef} className="relative group">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-white transition-colors duration-300 z-10 pointer-events-none" />
        <input
          type="text"
          required
          autoComplete="off"
          className="block w-full pl-9 pr-3 h-10 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-[#FF8731]/60 rounded-xl text-white text-[13px] font-semibold placeholder-slate-600 outline-none transition-all duration-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_0_3px_rgba(255,135,49,0.15),inset_0_1px_2px_rgba(0,0,0,0.4)]"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#03091B]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] z-50 max-h-[240px] overflow-y-auto"
            >
              {results.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(item)}
                    className="flex flex-col px-4 py-3 w-full text-left hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0"
                  >
                    <span className="text-white font-semibold text-[13px] truncate">{item.name}</span>
                    {item.city && <span className="text-slate-500 text-[11px] truncate mt-0.5 font-medium">{item.city}</span>}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BrandPanel = () => (
  <div className="relative flex flex-col justify-center lg:justify-start items-center lg:items-start text-center lg:text-left lg:pr-8 xl:pr-12 lg:pt-4 py-2">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex items-center gap-2 mb-3 lg:mb-5 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_24px_-12px_rgba(3,9,27,0.15)]"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#FF8731]" />
      <span
        className="text-[10.5px] font-black tracking-[0.22em] uppercase bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(90deg, #8756FA 0%, #B385FF 30%, #FF9E54 65%, #FF8731 100%)', backgroundSize: '200% 100%', animation: 'lemo-badge-shift 4s ease-in-out infinite alternate' }}
      >Lemons Training Hub</span>
    </motion.div>

    <motion.h1
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="font-serif font-black text-[#03091B] leading-[1.02] tracking-[-0.035em] text-[40px] sm:text-[52px] lg:text-[54px] xl:text-[64px]"
      style={{ WebkitFontSmoothing: 'antialiased', textWrap: 'balance' }}
    >
      Il training<br/>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8756FA] to-[#B385FF]">che accoglie</span>
    </motion.h1>

    <motion.p
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="mt-3 lg:mt-4 text-[#03091B]/70 text-[14px] lg:text-[15px] leading-relaxed max-w-[440px] font-bold"
      style={{ textShadow: '0 1px 8px rgba(255,255,255,0.7), 0 4px 20px rgba(255,255,255,0.4)' }}
    >
      Preparati a vivere la realtà virtuale in reparto.<br/>Un percorso formativo semplice, intuitivo e sicuro.
    </motion.p>
  </div>
);

const Welcome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [authType, setAuthType] = useState('login');
  const [regStep, setRegStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [hospital, setHospital] = useState('');
  const [department, setDepartment] = useState('');
  const [patientType, setPatientType] = useState('');

  const { t } = useLang();
  const w = t.welcome;
  const mode = searchParams.get('mode') || 'guided';

  useEffect(() => { 
    document.body.classList.add('no-bg-before'); 
    return () => document.body.classList.remove('no-bg-before'); 
  }, []);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('lemo_user'));
    if (savedUser && mode !== 'full') { navigate(`/home?mode=${mode}`); return; }
    if (mode === 'full') navigate('/home?mode=full');
  }, [mode, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (!email || !password) return;
    setErrorMsg(''); setLoading(true); audio.playClick();
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErrorMsg('Email o password errati.'); setLoading(false); return; }
    
    const { data: profile } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (profile) {
      const userData = { 
        name: profile.name, 
        firstName: profile.first_name, 
        lastName: profile.last_name, 
        email: profile.email, 
        phone: profile.phone, 
        hospital: profile.hospital, 
        department: profile.department, 
        patientType: profile.patient_type, 
        mode: profile.mode || mode 
      };
      localStorage.setItem('lemo_user', JSON.stringify(userData));
      await supabase.from('users').update({ 
        login_count: (profile.login_count || 0) + 1, 
        last_login: new Date().toISOString() 
      }).eq('email', email);
    } else {
      localStorage.setItem('lemo_user', JSON.stringify({ name: email, email, mode }));
    }
    navigate(`/home?mode=${mode}`);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); 
    if (!firstName || !lastName || !email || !password || !hospital || !department || !patientType) return;
    setErrorMsg(''); setLoading(true); audio.playClick();
    
    const fullName = `${firstName} ${lastName}`;
    const now = new Date().toISOString();
    const isDemoAccount = (firstName.toLowerCase().trim() === 'mario' && lastName.toLowerCase().trim() === 'rossi') || firstName.toLowerCase().trim() === 'demo';

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setErrorMsg(authError.message.includes('already registered') ? 'Questo indirizzo email è già registrato.' : 'Errore durante la registrazione. Riprova.');
      setLoading(false); return;
    }

    await supabase.from('users').insert({
      id: authData.user.id,
      name: fullName, first_name: firstName, last_name: lastName, email: email, phone: phone,
      hospital, department, patient_type: patientType, mode,
      login_count: 1, first_login: now, last_login: now,
      completed_modules: isDemoAccount ? [1, 2, 3, 4] : [],
    });

    const userData = { name: fullName, firstName, lastName, email, phone, hospital, department, patientType, mode };
    localStorage.setItem('lemo_user', JSON.stringify(userData));
    if (isDemoAccount) localStorage.setItem(`lemo_progress_${fullName}`, JSON.stringify([1, 2, 3, 4]));
    navigate(`/home?mode=${mode}`);
  };

  const handleForgot = async (e) => {
    e.preventDefault(); 
    if (!email) { setErrorMsg('Inserisci la tua email qui sopra.'); return; }
    setLoading(true); setErrorMsg(''); audio.playClick();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { 
      setErrorMsg('Errore invio email.'); 
    } else { 
      setErrorMsg('Successo! Controlla la tua email.'); 
    }
    setLoading(false);
  };

  const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
  const item = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 110, damping: 20 } } };

  const canSubmitLogin = email.trim() && password.trim();
  const canSubmitRegStep1 = firstName.trim() && lastName.trim() && email.trim() && password.trim();
  const canSubmitRegStep2 = hospital.trim() && department.trim() && patientType;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="relative min-h-[100dvh] w-full font-sans text-white overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-clouds.webp')" }} />
        <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
      </div>

      <header className="relative z-20 grid grid-cols-3 items-center px-5 sm:px-8 lg:px-10 pt-8 sm:pt-10 lg:pt-10">
        <div />
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="justify-self-center">
          <img src="/images/logos/logo esteso bianco png.png" alt="Lemons in the room" className="h-12 sm:h-16 lg:h-14 w-auto object-contain drop-shadow-[0_2px_12px_rgba(3,9,27,0.35)]" />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="justify-self-end">
          <LangPicker />
        </motion.div>
      </header>

      <main className="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-4 min-h-[calc(100dvh-60px)]">
        <motion.div variants={container} initial="hidden" animate="visible" className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-center">
          <BrandPanel />

          <motion.section variants={item} className="relative overflow-hidden rounded-[1.5rem] lg:rounded-[2rem] bg-[#03091B]/55 backdrop-blur-[40px] border border-white/[0.12] shadow-[0_30px_80px_-20px_rgba(3,9,27,0.6)] p-5 sm:p-6 lg:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            
            <motion.div variants={item} className="relative z-10 mb-5 flex flex-col items-center">
              <span className="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/[0.22] border border-white/[0.40] mb-2">
                <img src="/images/logos/logo png.png" alt="" aria-hidden="true" className="w-4 h-4 object-contain drop-shadow-[0_0_6px_rgba(255,135,49,0.5)]" />
                <span
                  className="text-[10px] font-black tracking-[0.18em] uppercase bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #FF8731 0%, #FF9E54 40%, #B385FF 75%, #8756FA 100%)', backgroundSize: '200% 100%', animation: 'lemo-badge-shift 4s ease-in-out infinite alternate' }}
                >{w.badge}</span>
              </span>
            </motion.div>

            <div className="flex bg-white/[0.05] p-1 rounded-xl mb-6 relative z-10">
              {['login', 'register'].map((tab) => {
                const isActive = authType === tab;
                const label = tab === 'login' ? 'Accedi' : 'Registrati';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { 
                      audio.playClick(); 
                      setAuthType(tab); 
                      if (tab === 'register') setRegStep(1); 
                      setErrorMsg(''); 
                    }}
                    className={`relative flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors z-10 ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="authTabBubble"
                        initial={false}
                        className="absolute inset-0 rounded-lg -z-10 shadow-lg"
                        style={{ background: 'linear-gradient(90deg, #8756FA 0%, #FF8731 100%)' }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm font-bold ${errorMsg.includes('Successo') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {authType === 'login' && (
              <form onSubmit={handleLogin} className="relative z-10 space-y-4">
                <Field icon={Mail} label={w.email} placeholder={w.placeholderEmail} value={email} onChange={(v) => setEmail(v.toLowerCase())} type="email" accent="#8756FA" disableCapitalize={true} />
                <Field icon={Lock} label="Password" placeholder="••••••••" value={password} onChange={setPassword} type="password" accent="#FF8731" />
                
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={() => { audio.playClick(); setAuthType('forgot'); setErrorMsg(''); }} className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors">
                    Hai dimenticato la password?
                  </button>
                </div>

                <div className="pt-2">
                  <motion.button type="submit" disabled={!canSubmitLogin || loading} className="group relative w-full h-11 rounded-xl overflow-hidden font-bold text-[14px] tracking-tight text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: canSubmitLogin ? 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)' : 'rgba(255,255,255,0.06)' }}>
                    <span className="relative z-10 flex items-center justify-center gap-2">{loading ? 'Caricamento...' : 'Entra in piattaforma'} <ArrowRight className="w-4 h-4" /></span>
                  </motion.button>
                </div>
              </form>
            )}

            {authType === 'register' && (
              <form onSubmit={handleRegister} className="relative z-10 space-y-4">
                <AnimatePresence mode="wait">
                  {regStep === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <Field icon={Type} label={w.firstName} placeholder={w.placeholderFirst} value={firstName} onChange={setFirstName} accent="#8756FA" />
                        <Field icon={SquareUser} label={w.lastName} placeholder={w.placeholderLast} value={lastName} onChange={setLastName} accent="#8756FA" />
                      </div>
                      <Field icon={Mail} label={w.email} placeholder={w.placeholderEmail} value={email} onChange={(v) => setEmail(v.toLowerCase())} type="email" accent="#8756FA" disableCapitalize={true} />
                      <Field icon={Lock} label="Password" placeholder="Crea una password" value={password} onChange={setPassword} type="password" accent="#8756FA" />
                      
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-200 uppercase ml-1 tracking-[0.18em]">
                          {w.phone} <span className="text-slate-400 normal-case tracking-normal font-medium">{w.phoneOptional}</span>
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-white transition-colors duration-300 z-10" />
                          <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={w.placeholderPhone} style={{ '--accent': '#8756FA' }} className="block w-full pl-9 pr-3 h-10 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] focus:border-[var(--accent)]/60 rounded-xl text-white text-[13px] font-semibold placeholder-slate-600 outline-none transition-all duration-300" />
                        </div>
                      </div>

                      <div className="pt-3">
                        <motion.button type="button" onClick={() => { audio.playClick(); setRegStep(2); }} disabled={!canSubmitRegStep1} className="group relative w-full h-11 rounded-xl overflow-hidden font-bold text-[14px] tracking-tight text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: canSubmitRegStep1 ? 'rgba(255,135,49,0.2)' : 'rgba(255,255,255,0.06)', border: canSubmitRegStep1 ? '1px solid rgba(255,135,49,0.5)' : '1px solid transparent' }}>
                          <span className="relative z-10 flex items-center justify-center gap-2 text-[#FF8731]">Continua <ArrowRight className="w-4 h-4" /></span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <HospitalSearch value={hospital} onChange={setHospital} placeholder={w.placeholderHospital} label={w.hospital} />
                      <Field icon={Stethoscope} label={w.department} placeholder={w.placeholderDept} value={department} onChange={setDepartment} accent="#FF8731" />
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-200 uppercase ml-1 tracking-[0.18em] mb-2">{w.patientProfile}</label>
                        <div className="flex gap-4 justify-center">
                          {[
                            { id: 'pediatria', label: w.pediatria, accent: '#8756FA', img: '/images/profilo-pediatria.webp' },
                            { id: 'adulti',    label: w.adulti,    accent: '#FF8731', img: '/images/profilo-adulti.webp'    },
                          ].map(p => {
                            const sel = patientType === p.id;
                            return (
                              <motion.label key={p.id} whileHover={{ scale: sel ? 1.03 : 1.02 }} whileTap={{ scale: 0.97 }} className="relative rounded-full overflow-hidden cursor-pointer flex-shrink-0" style={{ width: '150px', height: '150px', border: sel ? `2px solid ${p.accent}` : '1px solid rgba(255,255,255,0.10)' }}>
                                <input type="radio" name="patientType" value={p.id} className="hidden" onChange={(e) => { audio.playClick(); setPatientType(e.target.value); }} />
                                <img src={p.img} alt={p.label} className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${sel ? 'opacity-100 scale-105' : 'opacity-40 grayscale'}`} />
                                <div className="absolute inset-0" style={{ background: sel ? `linear-gradient(to top, #03091B 5%, ${p.accent}aa 55%, transparent 100%)` : 'linear-gradient(to top, #03091B 5%, rgba(3,9,27,0.55) 55%, transparent 100%)' }} />
                                <span className={`absolute left-0 right-0 bottom-3 text-center font-serif font-black tracking-tight text-[13px] ${sel ? 'text-white' : 'text-slate-200'}`}>{p.label}</span>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 flex gap-3">
                        <button type="button" onClick={() => { audio.playClick(); setRegStep(1); }} className="px-4 h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold flex items-center justify-center transition-colors">
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <motion.button type="submit" disabled={!canSubmitRegStep2 || loading} className="flex-1 group relative h-11 rounded-xl overflow-hidden font-bold text-[14px] text-white transition-all duration-300 disabled:opacity-50" style={{ background: canSubmitRegStep2 ? 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)' : 'rgba(255,255,255,0.06)' }}>
                          <span className="relative z-10 flex items-center justify-center gap-2">{loading ? 'Creazione...' : 'Crea Account'} <Check className="w-4 h-4" /></span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}

            {authType === 'forgot' && (
              <form onSubmit={handleForgot} className="relative z-10 space-y-4">
                <p className="text-sm text-slate-300 font-medium text-center mb-4">Inserisci la tua email e ti invieremo un link per creare una nuova password.</p>
                <Field icon={Mail} label={w.email} placeholder={w.placeholderEmail} value={email} onChange={(v) => setEmail(v.toLowerCase())} type="email" accent="#8756FA" disableCapitalize={true} />
                
                <div className="pt-2 flex flex-col gap-3">
                  <motion.button type="submit" disabled={!email || loading} className="group relative w-full h-11 rounded-xl overflow-hidden font-bold text-[14px] text-white transition-all disabled:opacity-50" style={{ background: email ? 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)' : 'rgba(255,255,255,0.06)' }}>
                    <span className="relative z-10 flex items-center justify-center">{loading ? 'Invio in corso...' : 'Invia link di recupero'}</span>
                  </motion.button>
                  <button type="button" onClick={() => { audio.playClick(); setAuthType('login'); setErrorMsg(''); }} className="text-xs font-bold text-slate-400 hover:text-white transition-colors text-center">
                    Torna al Login
                  </button>
                </div>
              </form>
            )}
            
          </motion.section>
        </motion.div>
      </main>
    </motion.div>
  );
};

export default Welcome;
