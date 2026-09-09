import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Award, ArrowRight, Check, Clock } from 'lucide-react';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
  animate, useMotionValueEvent,
} from 'framer-motion';

import { audio } from './utils/audio';
import { useLang } from './LanguageContext';
import { supabase } from './utils/supabase';

/* ── PROGRESS RING ─────────────────────────────────────────── */
const ProgressRing = ({ percent = 0, size = 220 }) => {
  const stroke = Math.round(size * 0.085);
  const radius = (size - stroke - 6) / 2;
  const C = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, percent));

  const counter = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const ctrl = animate(counter, target, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return ctrl.stop;
  }, [target, counter]);
  useMotionValueEvent(counter, 'change', (v) => setDisplay(Math.round(v)));

  const dashOffset = C - (C * target) / 100;
  const tipX = useTransform(counter, v => size / 2 + radius * Math.cos(((v / 100) * 360 * Math.PI) / 180));
  const tipY = useTransform(counter, v => size / 2 + radius * Math.sin(((v / 100) * 360 * Math.PI) / 180));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,135,49,0.30) 0%, transparent 60%)', filter: 'blur(24px)' }}
        animate={{ opacity: [0.55, 0.9, 0.55], scale: [0.95, 1.03, 0.95] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateX: [0, 3, -3, 0], rotateY: [0, -3, 3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformPerspective: 1000, transformStyle: 'preserve-3d', filter: 'drop-shadow(0 18px 30px rgba(3,9,27,0.55))' }}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 overflow-visible">
          <defs>
            <linearGradient id="lemoActivity" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"  stopColor="#FFB07A" />
              <stop offset="35%" stopColor="#FF9E54" />
              <stop offset="70%" stopColor="#FF8731" />
              <stop offset="100%" stopColor="#E65C00" />
            </linearGradient>
            <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#FF8731" floodOpacity="0.55" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {target > 0 && (
            <motion.circle
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke="url(#lemoActivity)" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
              filter="url(#ringGlow)"
            />
          )}
          {target > 2 && target < 100 && (
            <motion.circle
              cx={tipX} cy={tipY} r={stroke / 2 + 2}
              fill="#FF8731" filter="url(#ringGlow)"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif font-black text-white leading-none" style={{ fontSize: size * 0.22, textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
            {display}<span style={{ fontSize: size * 0.12 }} className="text-white/60 font-sans font-bold ml-0.5">%</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

/* ── MODULE STEPPER ────────────────────────────────────────── */
const ModuleStepper = ({ completed, total, moduleNames }) => (
  <div className="flex items-center gap-0 w-full max-w-full mx-auto md:mx-0 mb-6">
    {Array.from({ length: total }).map((_, i) => {
      const done = i < completed;
      const current = i === completed && i < total;
      const nodeW = total <= 4 ? 56 : total <= 6 ? 44 : 38;
      return (
        <Fragment key={i}>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
            className="relative flex flex-col items-center"
            style={{ width: nodeW }}
          >
            <div
              className={`rounded-full flex items-center justify-center font-bold transition-all duration-300 ${total <= 4 ? 'w-8 h-8 text-[12px]' : total <= 6 ? 'w-7 h-7 text-[11px]' : 'w-6 h-6 text-[10px]'}`}
              style={
                done
                  ? { background: 'linear-gradient(135deg, #FF9E54, #FF8731)', color: 'white', boxShadow: '0 6px 16px -4px rgba(255,135,49,0.6), inset 0 1px 0 rgba(255,255,255,0.35)' }
                  : current
                  ? { background: 'rgba(255,135,49,0.10)', border: '1.5px solid #FF8731', color: '#FF9E54', boxShadow: '0 0 0 4px rgba(255,135,49,0.10)' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#64748b' }
              }
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span>{i + 1}</span>}
            </div>
            {current && (
              <motion.div
                className="absolute rounded-full border-2 border-[#FF8731] pointer-events-none"
                animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.4 }}
                style={{ width: 32, height: 32, top: 0, left: '50%', marginLeft: -16 }}
              />
            )}
            <span className={`mt-1.5 font-black tracking-[0.08em] uppercase whitespace-nowrap text-center leading-tight ${total <= 5 ? 'text-[9px]' : 'text-[8px]'} ${done ? 'text-white/90' : current ? 'text-[#FF9E54]' : 'text-slate-500'}`}>
              {moduleNames[i]}
            </span>
          </motion.div>

          {i < total - 1 && (
            <div className="flex-1 h-px relative -mt-5 mx-1">
              <div className="absolute inset-0 bg-white/[0.08]" />
              <motion.div
                className="absolute inset-y-0 left-0"
                initial={{ width: 0 }}
                animate={{ width: i < completed ? '100%' : '0%' }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, #FF9E54, #FF8731)', boxShadow: '0 0 8px rgba(255,135,49,0.5)' }}
              />
            </div>
          )}
        </Fragment>
      );
    })}
  </div>
);

/* ── CHAPTER LINE ──────────────────────────────────────────── */
const ChapterLine = ({ num, label }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] font-black tracking-[0.22em] uppercase text-white/30">{String(num).padStart(2, '0')}</span>
    <span className="h-px w-8 bg-white/[0.15]" />
    {label && <span className="text-[10px] font-black tracking-[0.22em] uppercase text-white/30">{label}</span>}
  </div>
);

/* ── HOME ──────────────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const [completedCount, setCompletedCount] = useState(0);
  const mode = searchParams.get('mode') || 'guided';
  const { t, lang } = useLang();
  const h = t.home;

  const patientType = user?.patientType || 'adulti';
  const totalLessons = patientType === 'pediatria' ? 9 : 6;
  const moduleSteps = patientType === 'pediatria' ? h.moduleStepsPediatria : h.moduleStepsAdulti;

  const [certificateCode] = useState(() => `LMR-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`);
  const [certificateDate] = useState(() => new Date().toLocaleDateString('it-IT'));
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  const today = new Date();
  const dateLabel = today.toLocaleDateString(h.dateLocale, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  /* 3D tilt — hero */
  const heroRef = useRef(null);
  const heroMx = useMotionValue(0);
  const heroMy = useMotionValue(0);
  const heroSx = useSpring(heroMx, { stiffness: 100, damping: 20 });
  const heroSy = useSpring(heroMy, { stiffness: 100, damping: 20 });
  const heroRotateY = useTransform(heroSx, [-0.5, 0.5], [3, -3]);
  const heroRotateX = useTransform(heroSy, [-0.5, 0.5], [-2, 2]);
const onHeroMove = (e) => {
    const r = heroRef.current.getBoundingClientRect();
    heroMx.set((e.clientX - r.left) / r.width - 0.5);
    heroMy.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onHeroLeave = () => { heroMx.set(0); heroMy.set(0); };

  /* 3D tilt — progress */
  const progressRef = useRef(null);
  const progressMx = useMotionValue(0);
  const progressMy = useMotionValue(0);
  const progressSx = useSpring(progressMx, { stiffness: 100, damping: 20 });
  const progressSy = useSpring(progressMy, { stiffness: 100, damping: 20 });
  const progressRotateY = useTransform(progressSx, [-0.5, 0.5], [2, -2]);
  const progressRotateX = useTransform(progressSy, [-0.5, 0.5], [-1.5, 1.5]);
  const onProgressMove = (e) => {
    const r = progressRef.current.getBoundingClientRect();
    progressMx.set((e.clientX - r.left) / r.width - 0.5);
    progressMy.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onProgressLeave = () => { progressMx.set(0); progressMy.set(0); };

  useEffect(() => {
    window.scrollTo(0, 0);
    const savedUser = JSON.parse(localStorage.getItem('lemo_user'));
    if (!savedUser && mode !== 'full') {
      navigate('/');
    } else if (savedUser) {
      userRef.current = savedUser;
      setUser(savedUser);
      const savedProgress = JSON.parse(localStorage.getItem(`lemo_progress_${savedUser?.name}`)) || [];
      setCompletedCount(savedProgress.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, mode]);

  useEffect(() => {
    if (localStorage.getItem('lemo_newsletter_subscribed') === '1') return;
    if (sessionStorage.getItem('lemo_newsletter_dismissed') === '1') return;
    const timer = setTimeout(async () => {
      const u = userRef.current;
      if (u?.name) {
        const { data } = await supabase.from('users').select('newsletter_opt_in').eq('email', u.email).single();
        if (data?.newsletter_opt_in === true) {
          localStorage.setItem('lemo_newsletter_subscribed', '1');
          return;
        }
      }
      setShowNewsletter(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNewsletterAccept = async () => {
    const userEmail = user?.email;
    if (!userEmail) return;
    setNewsletterStatus('loading');
    await supabase.from('newsletter').upsert({ email: userEmail }, { onConflict: 'email' });
    if (user?.email) {
      await supabase.from('users').update({ newsletter_opt_in: true }).eq('email', user.email);
    }
    setNewsletterStatus('success');
    localStorage.setItem('lemo_newsletter_subscribed', '1');
    setTimeout(() => setShowNewsletter(false), 2500);
  };

  const closeNewsletter = async () => {
    setShowNewsletter(false);
    sessionStorage.setItem('lemo_newsletter_dismissed', '1');
    if (user?.email) {
      await supabase.from('users').update({ newsletter_opt_in: false }).eq('email', user.email);
    }
  };

  const progressPercentage = Math.round((completedCount / totalLessons) * 100);
  const hasFinishedAll = completedCount === totalLessons;

  const downloadCertificate = async () => {
    audio.playSuccess();
    const element = document.getElementById('certificate-template');
    element.style.display = 'block';
    const { default: html2pdf } = await import('html2pdf.js');
    html2pdf().set({
      margin: 0, filename: `Certificato_Lemons_${user?.lastName || 'Utente'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(element).save().then(() => element.style.display = 'none');
  };

  const handleNav = (path) => { audio.playClick(); navigate(path); };

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } } };
  const item = { hidden: { opacity: 0, y: 40, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20 } } };

  return (
    <motion.div
      className="px-4 pt-8 pb-6 md:px-8 md:pt-12 lg:px-12 lg:pt-16 min-h-[100dvh] relative"
    >
      <style>{`
        @keyframes lemoAurora {
          0%,100% { transform: translate(0,0) scale(1); opacity:.6; }
          33%      { transform: translate(8%,-4%) scale(1.05); opacity:.9; }
          66%      { transform: translate(-6%,6%) scale(1.08); opacity:.75; }
        }
        .lemo-aurora { animation: lemoAurora 12s ease-in-out infinite; }
        @keyframes lemoAuroraText { 0%{background-position:0% 50%} 100%{background-position:100% 50%} }
      `}</style>

      <div className="fixed inset-0 bg-cover bg-center z-0 bg-[url('/images/bg-mobile-nature.webp')] md:bg-[url('/images/bg-pc.webp')] pointer-events-none" />
      <div className="fixed top-[10%] right-[5%] w-[40vw] h-[40vw] bg-gradient-to-tr from-[#FF8731]/30 to-transparent rounded-full blur-[100px] pointer-events-none mix-blend-screen z-0" />
      <div className="fixed bottom-[10%] left-[5%] w-[50vw] h-[50vw] bg-gradient-to-tr from-[#8756FA]/20 to-transparent rounded-full blur-[120px] pointer-events-none mix-blend-screen z-0" />

      <div className="max-w-[1200px] 2xl:max-w-7xl mx-auto relative z-10 mb-20 md:mb-0 flex flex-col gap-4 lg:gap-5 2xl:gap-6">

        {/* ── HERO CARD ── */}
        <motion.div
          ref={heroRef}
          onMouseMove={onHeroMove}
          onMouseLeave={onHeroLeave}
          style={{ rotateX: heroRotateX, rotateY: heroRotateY, transformPerspective: 1400, transformStyle: 'preserve-3d' }}
          className="relative overflow-hidden bg-[#040F2A]/65 backdrop-blur-[40px] p-5 lg:p-6 2xl:p-12 rounded-[1.5rem] lg:rounded-[2rem] 2xl:rounded-[3.5rem] border border-white/[0.10] shadow-[0_30px_80px_-20px_rgba(3,9,27,0.7)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

          {/* Aurora blobs */}
          <div className="absolute -left-10 top-1/4 w-[60%] h-[80%] pointer-events-none">
            <div className="lemo-aurora absolute inset-0 rounded-full opacity-60"
              style={{ background: 'radial-gradient(circle at 40% 40%, rgba(135,86,250,0.50), transparent 65%)', filter: 'blur(60px)' }} />
            <div className="lemo-aurora absolute inset-0 rounded-full opacity-50"
              style={{ background: 'radial-gradient(circle at 60% 70%, rgba(255,135,49,0.40), transparent 60%)', filter: 'blur(70px)', animationDelay: '-4s' }} />
          </div>

          {/* Badge row */}
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 mb-3 2xl:mb-5">
            <div className="flex items-center gap-3 flex-wrap">
              <motion.div
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-full bg-white/[0.22] backdrop-blur-md border border-white/[0.40] shadow-xl shadow-black/5"
              >
                <img src="/images/logos/logo png.png" className="h-3.5 2xl:h-5 w-auto object-contain" alt="Lemons" />
                <span
                  className="text-[9px] lg:text-[10px] 2xl:text-sm font-bold tracking-widest uppercase bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(90deg, #8756FA 0%, #B385FF 30%, #FF9E54 65%, #FF8731 100%)', backgroundSize: '200% 100%', animation: 'lemo-badge-shift 4s ease-in-out infinite alternate' }}
                >{h.badge}</span>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.12em] uppercase ${hasFinishedAll ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400' : 'bg-[#FF8731]/10 border border-[#FF8731]/20 text-[#FF9E54]'}`}
              >
                <span className="relative flex w-2 h-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasFinishedAll ? 'bg-emerald-400' : 'bg-[#FF8731]'}`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${hasFinishedAll ? 'bg-emerald-400' : 'bg-[#FF8731]'}`} />
                </span>
                {hasFinishedAll ? h.badgeOperativo : h.badgeInCorso}
              </motion.span>
            </div>
            <span className="text-[11px] font-black tracking-[0.16em] uppercase text-white/70 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> {dateLabel}
            </span>
          </div>

          <ChapterLine num={1} label={h.chapterWelcome} />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-5xl lg:text-[3.5rem] 2xl:text-[4.5rem] font-black font-serif text-white tracking-tighter mb-1.5 2xl:mb-4 leading-[1.1] overflow-visible flex flex-wrap items-baseline gap-x-2 2xl:gap-x-4 drop-shadow-sm"
              >
                <span>{h.greeting}</span>
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #FF8731 0%, #FF9E54 35%, #B385FF 70%, #8756FA 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'lemoAuroraText 6s ease-in-out infinite alternate',
                    paddingRight: '0.05em',
                  }}
                >
                  {user?.firstName || h.guest}
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-slate-200 font-medium text-base lg:text-lg 2xl:text-2xl leading-relaxed drop-shadow-md"
              >
                {h.subtitle}
              </motion.p>
            </div>

          </div>
        </motion.div>

        {/* hairline */}
        <div className="h-px bg-white/[0.08] mx-2" />

        {/* ── PROGRESS CARD ── */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <motion.div
              ref={progressRef}
              onMouseMove={onProgressMove}
              onMouseLeave={onProgressLeave}
              style={{ rotateX: progressRotateX, rotateY: progressRotateY, transformPerspective: 1400, transformStyle: 'preserve-3d' }}
              className="group relative overflow-hidden bg-[#040F2A]/65 backdrop-blur-[40px] rounded-[2rem] 2xl:rounded-[3.5rem] p-8 lg:p-10 2xl:p-14 shadow-[0_30px_80px_-20px_rgba(3,9,27,0.7)] border border-white/[0.10] flex flex-col md:flex-row items-center gap-8 lg:gap-10 2xl:gap-12"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <div className="absolute -left-32 -top-32 w-[420px] h-[420px] rounded-full bg-[#FF8731] opacity-[0.12] blur-[120px] pointer-events-none" />
              <div className="absolute -right-32 -bottom-32 w-[420px] h-[420px] rounded-full bg-[#8756FA] opacity-[0.10] blur-[120px] pointer-events-none" />

              <ProgressRing percent={progressPercentage} size={220} />

              <div className="flex-1 text-center md:text-left relative z-10 w-full">
                <ChapterLine num={2} label={h.chapterProgress} />

                <h2 className="text-3xl lg:text-4xl 2xl:text-5xl font-black font-serif text-white mb-4 2xl:mb-6 leading-tight drop-shadow-sm">
                  {hasFinishedAll ? h.statusDone : h.statusProgress}
                </h2>

                <p className="hidden md:block text-slate-300 text-base 2xl:text-lg mb-6 2xl:mb-8 leading-relaxed font-medium">
                  {hasFinishedAll ? h.descDone : h.descProgress}
                </p>

                <div className="h-px bg-white/[0.08] mb-6 hidden md:block" />

                {!hasFinishedAll ? (
                  <motion.button
                    whileHover={{ scale: 1.025, y: -1 }} whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    onClick={() => handleNav(`/modules?mode=${mode}&autoopen=${completedCount + 1}`)}
                    className="group relative inline-flex items-center gap-3 px-7 py-4 lg:px-8 lg:py-5 rounded-2xl lg:rounded-[1.75rem] font-bold text-white text-[15px] lg:text-[16px] tracking-tight overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)',
                      boxShadow: '0 18px 40px -10px rgba(255,135,49,0.55), 0 10px 30px -10px rgba(135,86,250,0.55), inset 0 1px 0 rgba(255,255,255,0.30)',
                    }}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" />
                    <span className="relative z-10">{h.goModules}</span>
                    <span className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                      style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.30)', backdropFilter: 'blur(10px)' }}>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.025, y: -1 }} whileTap={{ scale: 0.97 }}
                    onClick={downloadCertificate}
                    className="group relative inline-flex items-center gap-3 px-7 py-4 lg:px-8 lg:py-5 rounded-2xl lg:rounded-[1.75rem] font-bold text-white text-[15px] lg:text-[16px] tracking-tight overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, #FF8731 0%, #FF9E54 100%)',
                      boxShadow: '0 18px 40px -10px rgba(255,135,49,0.65), inset 0 1px 0 rgba(255,255,255,0.35)',
                    }}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" />
                    <Award className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{h.getCert}</span>
                  </motion.button>
                )}

                <div className="mt-6 pt-3">
                  <ModuleStepper key={lang} completed={completedCount} total={totalLessons} moduleNames={moduleSteps} />
                </div>

                <p className="md:hidden text-slate-300 text-base leading-relaxed font-medium mt-4">
                  {hasFinishedAll ? h.descDone : h.descProgress}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

      </div>

      {/* ── NEWSLETTER POPUP ── */}
      <AnimatePresence>
        {showNewsletter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 pb-28 sm:pb-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) closeNewsletter(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md bg-[#03091B]/90 backdrop-blur-[40px] border border-white/[0.12] rounded-[2rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[280px] h-[280px] rounded-full bg-[#8756FA] opacity-[0.12] blur-[80px] pointer-events-none" />

              {newsletterStatus === 'success' ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8756FA] to-[#FF8731] flex items-center justify-center mb-4 shadow-[0_8px_32px_-8px_rgba(135,86,250,0.6)]">
                    <img src="/images/logos/logo bianco png.png" alt="Lemons" className="w-8 h-8 object-contain" />
                  </div>
                  <h3 className="font-serif font-black text-white text-2xl mb-2">{h.newsletterSuccessTitle}</h3>
                  <p className="text-slate-400 text-sm font-medium">{h.newsletterSuccessDesc}</p>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8756FA]/15 border border-[#8756FA]/30 mb-4">
                    <img src="/images/logos/logo bianco png.png" alt="" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-[10px] font-black tracking-[0.18em] uppercase text-[#A379F9]">Lemons Universe</span>
                  </div>
                  <h3 className="font-serif font-black text-white text-[28px] leading-tight mb-2">
                    {h.newsletterTitle}<br/>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8756FA] to-[#FF8731]">{h.newsletterTitleAccent}</span>
                  </h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[300px] mb-6">
                    {h.newsletterDesc}
                  </p>
                  {user?.email && (
                    <p className="text-white/60 text-xs font-semibold mb-5 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                      {user.email}
                    </p>
                  )}
                  <div className="w-full space-y-2">
                    <motion.button
                      onClick={handleNewsletterAccept}
                      disabled={newsletterStatus === 'loading'}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="group w-full h-12 rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60"
                      style={{ background: 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)', boxShadow: '0 8px 32px -8px rgba(135,86,250,0.5)' }}
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      <span className="relative z-10">{newsletterStatus === 'loading' ? h.newsletterSubmitting : h.newsletterSubmit}</span>
                    </motion.button>
                    <button type="button" onClick={closeNewsletter} className="w-full text-center text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors pt-1">
                      {h.newsletterNo}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CERTIFICATO INVISIBILE ── */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="certificate-template" style={{ width: '1123px', height: '794px', backgroundColor: '#ffffff', position: 'relative', overflow: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '25px solid #03091B', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '35px', left: '35px', right: '35px', bottom: '35px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', bottom: '40px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', backgroundColor: '#FF8731', borderRadius: '50%', opacity: '0.2' }} />
          <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', backgroundColor: '#03091B', borderRadius: '50%', opacity: '0.05' }} />
          <div style={{ position: 'relative', zIndex: 10, height: '100%', padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <img src="/images/logos/logo esteso nero png.png" alt="Lemons in the room" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>{h.certCode}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#03091B', letterSpacing: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>{certificateCode}</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '-20px' }}>
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ margin: 0, fontSize: '56px', fontWeight: '900', color: '#03091B', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: "'Recoleta Alt', serif" }}>{h.certTitle}</h1>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#FF8731', margin: '15px auto 0 auto' }} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>{h.certConferredTo}</p>
                <h2 style={{ margin: 0, fontSize: '48px', fontWeight: 'bold', color: '#03091B', textTransform: 'capitalize' }}>{user?.name || 'Mario Rossi'}</h2>
              </div>
              <p style={{ margin: '0 auto', fontSize: '18px', color: '#475569', lineHeight: '1.5', maxWidth: '800px' }}>
                {h.certBody('Lemons in the room', user?.hospital || h.certFallbackHospital, user?.department || h.certFallbackDept)}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 20px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ margin: '0 auto 8px auto', fontSize: '20px', fontWeight: 'bold', color: '#03091B', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', maxWidth: '180px' }}>{certificateDate}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{h.certDate}</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '900', color: '#03091B', textAlign: 'center', lineHeight: '1.2', marginBottom: '8px', letterSpacing: '1px' }}>LEMONS<br/>CERTIFIED</span>
                <img src="/images/logos/Logo nero png.png" alt="Lemons Certified" style={{ width: '40px', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ margin: '0 auto 8px auto', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', maxWidth: '220px', display: 'flex', justifyContent: 'center' }}>
                  <img src="/images/firma-ceo.png" alt="Firma CEO Lemons" style={{ height: '50px', objectFit: 'contain' }} />
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>{h.certSig}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};

export default Home;
