import { useState, useRef, useEffect } from 'react';
import { Clock,
  HelpCircle, ChevronDown, Send, CheckCircle, Sparkles, Phone, ShieldCheck,
  Wrench, MessageSquareHeart, AlertTriangle, ArrowRight,
} from 'lucide-react';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useSpring,
} from 'framer-motion';
import { audio } from './utils/audio';
import { supabase } from './utils/supabase';
import { useLang } from './LanguageContext';

const TAG_COLORS = {
  Generale:  { bg: 'rgba(135,86,250,0.12)', border: 'rgba(135,86,250,0.30)', text: '#B385FF' },
  Sicurezza: { bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.30)',  text: '#34D399' },
  Hardware:  { bg: 'rgba(255,135,49,0.10)',  border: 'rgba(255,135,49,0.30)',  text: '#FF9E54' },
  Software:  { bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.30)',  text: '#7DD3FC' },
};
const DEFAULT_TAG = TAG_COLORS.Generale;

const ChapterLine = ({ num, label }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] font-black tracking-[0.22em] uppercase text-white/30">{String(num).padStart(2, '0')}</span>
    <span className="h-px w-8 bg-white/[0.15]" />
    {label && <span className="text-[10px] font-black tracking-[0.22em] uppercase text-white/30">{label}</span>}
  </div>
);

const FaqItem = ({ faq, index, isOpen, onToggle, tagLabels }) => {
  const tc = TAG_COLORS[faq.tag] || DEFAULT_TAG;
  const tagLabel = (tagLabels && tagLabels[faq.tag]) || faq.tag;
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] lg:rounded-[1.75rem] backdrop-blur-[40px] border transition-colors duration-300 ${
        isOpen
          ? 'bg-[#03091B]/60 border-[#8756FA]/35'
          : 'bg-[#040F2A]/65 border-white/[0.08] hover:border-[#8756FA]/25'
      }`}
    >
      <button
        onClick={onToggle}
        className="relative z-10 w-full text-left px-5 py-4 lg:px-6 lg:py-5 flex items-start gap-4"
      >
        <div className="flex-1 min-w-0">
          {faq.tag && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-[0.16em] uppercase mb-2"
              style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text }}
            >
              {tagLabel}
            </span>
          )}
          <h4 className={`font-serif font-black text-[16px] lg:text-[17px] 2xl:text-[20px] leading-[1.25] tracking-[-0.01em] ${isOpen ? 'text-white' : 'text-slate-100'}`}>
            {faq.q}
          </h4>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: isOpen ? 'linear-gradient(135deg, #8756FA, #6A35E8)' : 'rgba(255,255,255,0.05)',
            border: isOpen ? '1px solid rgba(255,255,255,0.20)' : '1px solid rgba(255,255,255,0.10)',
            boxShadow: isOpen ? '0 8px 20px -6px rgba(135,86,250,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
          }}
        >
          <ChevronDown className="w-4 h-4 text-white" strokeWidth={2.6} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.08] mx-5 lg:mx-6" />
            <p className="relative z-10 px-5 pt-4 pb-5 lg:px-6 lg:pt-5 lg:pb-6 text-slate-300 font-medium text-[13.5px] lg:text-[14.5px] 2xl:text-base leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContactCard = ({ name, role, desc, phone, accent, callNow }) => {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [4, -4]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-3, 3]);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const accentColor = accent === 'orange' ? '#FF8731' : '#8756FA';
  const accentDeep  = accent === 'orange' ? '#E65C00' : '#6A35E8';
  const accentLight = accent === 'orange' ? '#FF9E54' : '#B385FF';
  const initials = name.split(' ').map(w => w[0]).join('');

  return (
    <motion.a
      ref={ref}
      href={`tel:${phone.replace(/\s+/g, '')}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => audio.playClick()}
      style={{ rotateX, rotateY, transformPerspective: 1600 }}
      whileTap={{ scale: 0.99 }}
      className="group relative block overflow-hidden rounded-[1.75rem] lg:rounded-[2rem] p-5 lg:p-6 2xl:p-8 bg-[#040F2A]/65 backdrop-blur-[40px] border border-white/[0.10] hover:border-white/20 transition-colors"
    >
      <div
        className="absolute -top-20 -right-10 w-[260px] h-[260px] rounded-full opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{ background: accentColor, filter: 'blur(80px)' }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-full flex items-center justify-center font-serif font-black text-white text-[18px] 2xl:text-[20px] tracking-tight"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentDeep})`,
              boxShadow: `0 12px 30px -8px ${accentColor}88, inset 0 1px 0 rgba(255,255,255,0.30)`,
            }}
          >
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#03091B] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-60 animate-ping" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-[0.16em] uppercase"
              style={{
                background: `${accentColor}14`,
                border: `1px solid ${accentColor}55`,
                color: accentLight,
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {role}
            </span>
          </div>
          <h3 className="font-serif font-black text-white text-[20px] 2xl:text-[22px] leading-tight truncate">{name}</h3>
          {desc && <p className="text-slate-400 text-[12px] 2xl:text-sm font-medium mt-0.5">{desc}</p>}
        </div>
      </div>

      <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
              border: `1px solid ${accentColor}33`,
            }}
          >
            <Phone className="w-4 h-4" style={{ color: accentColor }} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <div className="text-[9.5px] font-black tracking-[0.18em] uppercase text-slate-500">{callNow}</div>
            <div className="text-white font-bold text-[15.5px] 2xl:text-base tracking-tight truncate">{phone}</div>
          </div>
        </div>
        <motion.div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight className="w-4 h-4 text-white" strokeWidth={2.4} />
        </motion.div>
      </div>
    </motion.a>
  );
};

const SegmentedControl = ({ value, onChange, options }) => (
  <div className="relative grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
    {options.map(opt => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-bold transition-colors"
        >
          {active && (
            <motion.div
              layoutId="segActive"
              className="absolute inset-0 rounded-xl"
              style={{
                background: opt.value === 'Tecnico'
                  ? 'linear-gradient(135deg, #FF8731, #E65C00)'
                  : 'linear-gradient(135deg, #8756FA, #6A35E8)',
                boxShadow: opt.value === 'Tecnico'
                  ? '0 8px 22px -8px rgba(255,135,49,0.6), inset 0 1px 0 rgba(255,255,255,0.30)'
                  : '0 8px 22px -8px rgba(135,86,250,0.6), inset 0 1px 0 rgba(255,255,255,0.30)',
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <opt.icon className={`w-3.5 h-3.5 relative z-10 ${active ? 'text-white' : 'text-slate-400'}`} strokeWidth={2.4} />
          <span className={`relative z-10 ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</span>
        </button>
      );
    })}
  </div>
);

const Support = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketType, setTicketType] = useState('Tecnico');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { t, lang } = useLang();
  const s = t.support;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    audio.playClick();
    setIsSubmitting(true);
    setErrorMessage('');

    const savedUser = JSON.parse(localStorage.getItem('lemo_user')) || {};

    const payload = {
      subject: ticketSubject,
      ticketType,
      message: ticketMessage,
      user_name: savedUser.name || '—',
      hospital: savedUser.hospital || '—',
      department: savedUser.department || '—',
      patientType: savedUser.patientType || '—',
      lang,
    };

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token || '';
      const r = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (r.ok) {
        setTicketSent(true);
        setTicketSubject('');
        setTicketMessage('');
        setTimeout(() => setTicketSent(false), 5000);
      } else {
        setErrorMessage(s.errorSend);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(s.errorConnection);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accent = ticketType === 'Tecnico' ? '#FF8731' : '#8756FA';

  const heroRef = useRef(null);
  const heroMx = useMotionValue(0);
  const heroMy = useMotionValue(0);
  const heroSx = useSpring(heroMx, { stiffness: 100, damping: 20 });
  const heroSy = useSpring(heroMy, { stiffness: 100, damping: 20 });
  const heroRotateY = useTransform(heroSx, [-0.5, 0.5], [2, -2]);
  const heroRotateX = useTransform(heroSy, [-0.5, 0.5], [-1.5, 1.5]);
  const onHeroMove = (e) => {
    const r = heroRef.current.getBoundingClientRect();
    heroMx.set((e.clientX - r.left) / r.width - 0.5);
    heroMy.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onHeroLeave = () => { heroMx.set(0); heroMy.set(0); };

  return (
    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="px-6 pt-12 pb-6 md:px-10 md:pt-12 lg:px-12 lg:pt-12 2xl:p-16 2xl:pt-20 max-w-[1200px] 2xl:max-w-7xl mx-auto mb-20 md:mb-0 relative z-10 min-h-[100dvh]">

      {/* Backgrounds */}
      <div className="fixed inset-0 bg-cover bg-center z-[-30] bg-[url('/images/bg-mobile-support.webp')] md:hidden opacity-30 dark:opacity-20 mix-blend-luminosity"></div>
      <div className="hidden md:block fixed inset-0 bg-cover bg-center z-[-30] bg-[url('/images/bg-support.webp')] opacity-100"></div>
      <div className="hidden md:block fixed inset-0 bg-[#03091B]/60 backdrop-blur-[2px] z-[-29]"></div>
      <div className="fixed top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-gradient-to-tr from-[#FF8731] to-transparent rounded-full blur-[120px] opacity-20 pointer-events-none -z-20"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-gradient-to-tr from-[#8756FA] to-transparent rounded-full blur-[100px] opacity-15 pointer-events-none -z-20"></div>

      {/* Hero Header */}
      <motion.div
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        style={{ rotateX: heroRotateX, rotateY: heroRotateY, transformPerspective: 1400, transformStyle: 'preserve-3d' }}
        className="mb-4 lg:mb-5 2xl:mb-8 relative overflow-hidden bg-[#040F2A]/65 backdrop-blur-[40px] p-5 lg:p-6 2xl:p-12 rounded-[1.5rem] lg:rounded-[2rem] 2xl:rounded-[3.5rem] border border-white/[0.10] shadow-[0_30px_80px_-20px_rgba(3,9,27,0.7)] z-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 mb-3 2xl:mb-5 flex-wrap">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="inline-flex items-center gap-2 px-3 py-1.5 2xl:px-4 2xl:py-2 rounded-full bg-white/[0.22] backdrop-blur-md border border-white/[0.40] shadow-xl shadow-black/5">
            <img src="/images/logos/logo png.png" className="h-3.5 2xl:h-5 w-auto object-contain" alt="Lemons" />
            <span
              className="text-xs 2xl:text-sm font-bold tracking-widest uppercase bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #8756FA 0%, #B385FF 30%, #FF9E54 65%, #FF8731 100%)', backgroundSize: '200% 100%', animation: 'lemo-badge-shift 4s ease-in-out infinite alternate' }}
            >{s.badge}</span>
          </motion.div>
        </div>

        <ChapterLine num={1} label={s.chapterSupport} />

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }} className="text-5xl md:text-[3rem] lg:text-[3.5rem] 2xl:text-[4.5rem] font-black font-serif text-white tracking-tighter mb-1 leading-[1.1] pr-10 overflow-visible flex flex-wrap items-baseline gap-x-4">
          <span>{s.titleMain}</span>
          <span className="relative inline-block overflow-visible">
            <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#FF8731] to-[#FF9E54] drop-shadow-sm pr-4">{s.titleAccent}</span>
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }} className="text-slate-300 font-medium text-base lg:text-lg 2xl:text-2xl leading-relaxed mt-1">
          {s.subtitle}
        </motion.p>
      </motion.div>

      <div className="h-px bg-white/[0.08] mx-2 mb-6 lg:mb-8 2xl:mb-10" />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_auto_1fr] gap-5 lg:gap-7 2xl:gap-10 relative z-10">

        {/* LEFT — FAQ */}
        <motion.section
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          className="flex flex-col gap-3 lg:gap-4"
        >
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(135,86,250,0.25), rgba(135,86,250,0.08))',
                border: '1px solid rgba(135,86,250,0.30)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px -8px rgba(135,86,250,0.4)',
              }}
            >
              <HelpCircle className="w-5 h-5 text-[#A379F9]" strokeWidth={2.2} />
            </div>
            <h2 className="font-serif font-black text-white text-[24px] lg:text-[28px] 2xl:text-[34px] tracking-[-0.025em] leading-tight">{s.faqTitle}</h2>
          </div>

          {s.faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } } }}
            >
              <FaqItem
                faq={faq}
                index={i}
                isOpen={openFaq === i}
                onToggle={() => { audio.playClick(); setOpenFaq(openFaq === i ? null : i); }}
                tagLabels={s.tagLabels}
              />
            </motion.div>
          ))}
        </motion.section>

        {/* Vertical divider */}
        <div className="hidden lg:flex flex-col items-center py-2">
          <div className="flex-1 w-px bg-gradient-to-b from-transparent via-white/[0.12] to-transparent" />
        </div>

        {/* RIGHT — Contacts + Form */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-5 lg:gap-6"
        >
          {/* Ticket Form */}
          <div className="relative overflow-hidden rounded-[2rem] lg:rounded-[2.25rem] 2xl:rounded-[3rem] p-6 lg:p-8 2xl:p-12 bg-[#040F2A]/65 backdrop-blur-[40px] border border-white/[0.10] shadow-[0_30px_80px_-20px_rgba(3,9,27,0.7)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-12 w-[280px] h-[280px] rounded-full bg-[#8756FA] opacity-[0.15] blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex items-start gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(135,86,250,0.25), rgba(135,86,250,0.08))',
                  border: '1px solid rgba(135,86,250,0.30)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px -8px rgba(135,86,250,0.40)',
                }}
              >
                <Send className="w-5 h-5 text-[#A379F9]" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-black text-white text-[22px] lg:text-[24px] 2xl:text-[28px] leading-tight tracking-[-0.02em]">{s.ticketTitle}</h3>
                <p className="text-slate-400 text-[12.5px] 2xl:text-sm font-medium mt-0.5 leading-relaxed pr-2">{s.ticketDesc}</p>
              </div>
            </div>

            <div className="relative z-10 mb-5 flex items-start gap-2.5 rounded-2xl border border-[#FF8731]/20 bg-[#FF8731]/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-slate-300 font-medium">
              <Clock className="w-4 h-4 text-[#FF9E54] shrink-0 mt-0.5" strokeWidth={2.2} />
              <span>{s.ticketSla}</span>
            </div>

            <AnimatePresence mode="wait">
              {ticketSent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="relative z-10 flex flex-col items-center text-center py-10 px-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04]"
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      boxShadow: '0 14px 30px -8px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.4} />
                  </motion.div>
                  <h4 className="font-serif font-black text-white text-[22px] mb-1">{s.sentTitle}</h4>
                  <p className="text-slate-300 text-[13px] font-medium">{s.sentDesc}</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleTicketSubmit}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="relative z-10 space-y-4"
                >
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.18em] uppercase text-slate-400 mb-2 ml-1">{s.ticketType}</label>
                    <SegmentedControl
                      value={ticketType}
                      onChange={(v) => { audio.playClick(); setTicketType(v); }}
                      options={[
                        { value: 'Tecnico',   label: s.optionTech,  icon: Wrench },
                        { value: 'Operativo', label: s.optionOp,    icon: MessageSquareHeart },
                      ]}
                    />
                    <p className="mt-2 ml-1 text-[11px] text-slate-500 font-medium">
                      {ticketType === 'Tecnico' ? s.optionTech : s.optionOp}
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black tracking-[0.18em] uppercase text-slate-400 mb-2 ml-1">{s.ticketSubject}</label>
                    <div className="relative">
                      <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="text" required
                        value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder={s.placeholderSubject}
                        style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}
                        onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${accent}22, inset 0 1px 2px rgba(0,0,0,0.4)`; e.target.style.borderColor = `${accent}99`; }}
                        onBlur={(e)  => { e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.4)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        className="block w-full pl-11 pr-4 h-12 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white text-[14px] font-semibold placeholder-slate-600 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black tracking-[0.18em] uppercase text-slate-400 mb-2 ml-1">{s.ticketDetails}</label>
                    <textarea
                      required rows="4"
                      value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={s.placeholderDetails}
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)' }}
                      onFocus={(e) => { e.target.style.boxShadow = `0 0 0 3px ${accent}22, inset 0 1px 2px rgba(0,0,0,0.4)`; e.target.style.borderColor = `${accent}99`; }}
                      onBlur={(e)  => { e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.4)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      className="block w-full px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white text-[14px] font-medium placeholder-slate-600 outline-none transition-all duration-300 resize-none"
                    />
                  </div>

                  <motion.button
                    type="submit" disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.015, y: -1 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="group relative w-full mt-1 rounded-2xl overflow-hidden font-bold text-white text-[15px] tracking-tight disabled:opacity-60 disabled:cursor-not-allowed py-3.5"
                    style={{
                      background: 'linear-gradient(90deg, #8756FA 0%, #B385FF 50%, #FF8731 100%)',
                      boxShadow: '0 18px 40px -10px rgba(255,135,49,0.55), 0 10px 30px -10px rgba(135,86,250,0.55), inset 0 1px 0 rgba(255,255,255,0.30)',
                    }}
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none" />
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                      {isSubmitting ? s.submitting : s.submitBtn}
                      {!isSubmitting && <Send className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.5} />}
                    </span>
                  </motion.button>

                  {errorMessage && (
                    <p className="text-red-400 text-[12px] font-bold text-center mt-2 bg-red-500/10 py-2.5 rounded-xl border border-red-500/20">
                      {errorMessage}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    {s.gdprNote}
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,135,49,0.25), rgba(255,135,49,0.08))',
                border: '1px solid rgba(255,135,49,0.30)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px -8px rgba(255,135,49,0.4)',
              }}
            >
              <Phone className="w-5 h-5 text-[#FF9E54]" strokeWidth={2.2} />
            </div>
            <h2 className="font-serif font-black text-white text-[24px] lg:text-[28px] 2xl:text-[34px] tracking-[-0.025em] leading-tight">{s.directTitle}</h2>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            <ContactCard
              name="Ing. Leonardo Bragalli"
              role={s.techSupport}
              phone="+39 348 758 9509"
              accent="orange"
              callNow={s.callNow}
            />
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
};

export default Support;
