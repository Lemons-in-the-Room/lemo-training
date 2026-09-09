import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, LifeBuoy, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from './ThemeContext';
import { useLang } from './LanguageContext';
import { audio } from './utils/audio';
import { supabase } from './utils/supabase';

const LANGUAGES = [
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' },
  { code: 'en', label: 'English',  flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español',  flag: 'https://flagcdn.com/w40/es.png' },
];

const LangPicker = ({ isHome, isDarkMode }) => {
  const { lang, switchLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => { audio.playClick(); setOpen(o => !o); }}
        className="flex items-center gap-3 px-4 py-3 2xl:gap-4 2xl:px-6 2xl:py-5 w-full rounded-[1.5rem] 2xl:rounded-[2rem] transition-all duration-300 text-left font-bold group text-slate-400 hover:text-white hover:bg-white/[0.07]"
      >
        <img src={current.flag} alt={current.label} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
        <span className="text-base 2xl:text-lg">{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-[#03091B]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-xl z-50"
          >
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { audio.playClick(); switchLang(l.code); setOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 2xl:px-6 2xl:py-4 w-full text-left font-bold text-sm 2xl:text-base transition-all duration-200 ${lang === l.code ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <img src={l.flag} alt={l.label} className="w-5 h-3.5 object-cover rounded-sm" />
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileLangPicker = ({ isDarkMode, inline }) => {
  const { lang, switchLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => { audio.playClick(); setOpen(o => !o); }}
        className={inline
          ? `flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`
          : `w-12 h-12 rounded-full backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all text-lg ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'}`
        }
      >
        <img src={current.flag} alt={current.label} className="w-6 h-4 object-cover rounded-sm shadow-sm" />
        {inline && <span className="text-[9px] font-black uppercase tracking-widest">{current.code.toUpperCase()}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 right-0 bg-[#03091B]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-xl z-50 min-w-[140px]"
          >
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { audio.playClick(); switchLang(l.code); setOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 w-full text-left font-bold text-sm transition-all duration-200 ${lang === l.code ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                <img src={l.flag} alt={l.label} className="w-5 h-3.5 object-cover rounded-sm" />
                <span>{l.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

  const Layout = () => {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'guided';
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useContext(ThemeContext);
    const { t } = useLang();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isHome = location.pathname.includes('/home');

  const navItems = [
    { icon: Home,     label: t.nav.home,    path: `/home?mode=${mode}` },
    { icon: BookOpen, label: t.nav.modules, path: `/modules?mode=${mode}` },
    { icon: LifeBuoy, label: t.nav.support, path: `/support?mode=${mode}` },
  ];

  const handleLogoutClick = () => {
    audio.playClick();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    audio.playClick();
    localStorage.removeItem('lemo_user');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const cancelLogout = () => {
    audio.playClick();
    setShowLogoutConfirm(false);
  };

  const handleNavClick = () => audio.playClick();

  return (
    <div className="font-sans md:flex md:h-[100dvh] md:overflow-hidden">
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#040F2A] border border-white/10 p-6 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2 text-center">Sei sicuro di voler uscire?</h3>
              <p className="text-slate-400 text-sm text-center mb-6">Dovrai inserire nuovamente le tue credenziali per rientrare nella piattaforma.</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-4 rounded-xl text-slate-300 font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 px-4 rounded-xl text-white font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  Sì, esci
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background fisso solo per le pagine interne */}
      <div className="fixed inset-0 -z-10 md:hidden" style={{ background: '#03091B' }} />
      <div className="fixed inset-0 -z-10 hidden md:block bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/bg-pc.webp')" }} />

      {/* Sidebar Desktop */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="hidden md:flex flex-col w-64 2xl:w-80 m-4 2xl:m-6 rounded-[2rem] 2xl:rounded-[3rem] shadow-[0_40px_100px_-10px_rgba(3,9,27,0.7)] relative z-50 overflow-hidden bg-[#040F2A]/80 backdrop-blur-[40px] border border-white/[0.10]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-[#FF8731] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="p-4 2xl:p-10 flex items-center justify-center border-b shrink-0 border-white/[0.08]">
          <img src="/images/logos/logo esteso bianco png.png" alt="Lemons in the room Logo" className="h-8 2xl:h-16 w-auto object-contain drop-shadow-md"
            onError={(e) => { e.target.src = '/images/logos/logo esteso nero png.png'; }} />
        </div>

        <nav className="flex-1 min-h-0 px-4 py-4 2xl:px-6 2xl:py-6 overflow-y-auto space-y-1 2xl:space-y-4">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 2xl:gap-5 2xl:px-6 2xl:py-5 rounded-[1.5rem] 2xl:rounded-[2rem] font-bold transition-all duration-300 relative group overflow-hidden shrink-0 ${
                  isActive ? 'text-white shadow-[0_20px_40px_-10px_rgba(255,135,49,0.5)] scale-[1.02]' :
                  'text-slate-400 hover:text-white hover:bg-white/[0.07]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 bg-gradient-to-r from-[#FF8731] to-[#FF9E54] z-0" />}
                  <item.icon className={`w-5 h-5 2xl:w-6 2xl:h-6 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="relative z-10 text-base 2xl:text-lg tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 2xl:p-8 space-y-1 2xl:space-y-2 border-t border-white/[0.08] shrink-0">
          <LangPicker isHome={isHome} isDarkMode={isDarkMode} />

          <a href="https://www.lemonsintheroom.com/" target="_blank" rel="noopener noreferrer" onClick={() => audio.playClick()} className="flex items-center gap-3 px-4 py-3 2xl:gap-4 2xl:px-6 2xl:py-5 w-full rounded-[1.5rem] 2xl:rounded-[2rem] transition-all duration-300 text-left font-bold group text-slate-400 hover:text-white hover:bg-white/[0.07]">
            <Globe className="w-5 h-5 2xl:w-6 2xl:h-6 group-hover:rotate-12 transition-transform duration-500" />
            <span className="text-base 2xl:text-lg">{t.nav.visitSite}</span>
          </a>

          <button onClick={handleLogoutClick} className="flex items-center gap-3 px-4 py-3 2xl:gap-4 2xl:px-6 2xl:py-5 w-full rounded-[1.5rem] 2xl:rounded-[2rem] transition-all duration-300 text-left font-bold group text-slate-500 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-5 h-5 2xl:w-6 2xl:h-6 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-base 2xl:text-lg">{t.nav.logout}</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Top Actions */}
      <div className="md:hidden fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
        <a href="https://www.lemonsintheroom.com/" target="_blank" rel="noopener noreferrer" onClick={() => audio.playClick()} className="w-12 h-12 rounded-full backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all bg-[#040F2A]/80 border-white/[0.12] text-slate-400 hover:text-white">
          <Globe className="w-5 h-5" />
        </a>
        <button onClick={handleLogoutClick} className="w-12 h-12 rounded-full backdrop-blur-2xl border flex items-center justify-center shadow-lg transition-all bg-[#040F2A]/80 border-white/[0.12] text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-5 h-5 ml-0.5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="md:flex-1 md:overflow-y-auto relative scroll-smooth bg-transparent pb-28 md:pb-0">
        <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#FF8731] rounded-full blur-[150px] opacity-20 pointer-events-none -z-10"></div>
        <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8756FA] rounded-full blur-[120px] opacity-20 pointer-events-none -z-10"></div>
        <Outlet />
      </main>

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 z-50">
        <div className="backdrop-blur-[40px] border flex justify-around items-center p-2 rounded-[2.5rem] bg-[#040F2A]/85 border-white/[0.10] shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] rounded-full transition-all duration-500 relative group overflow-hidden ${
                  isActive ? 'text-white bg-gradient-to-br from-[#8756FA] to-[#FF8731] shadow-[0_10px_20px_rgba(255,135,49,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] z-10' :
                  'text-slate-400 hover:text-white hover:bg-white/[0.07] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-6 h-6 mb-1 relative z-10 transition-transform duration-300 ${isActive ? 'drop-shadow-md scale-105' : 'group-hover:scale-110'}`} />
                  <span className="text-[8px] font-black leading-none uppercase tracking-wide relative z-10 drop-shadow-sm truncate max-w-full px-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Lingua come 4° voce */}
          <MobileLangPicker isDarkMode={isDarkMode} inline />
        </div>
      </div>

    </div>
  );
};
export default Layout;
