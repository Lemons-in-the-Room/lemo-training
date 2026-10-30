/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import it from './i18n/lang-it';
import { ui } from './i18n/ui';

// L'italiano è sempre incluso; inglese e spagnolo si scaricano solo se qualcuno li sceglie.
const LOADERS = { en: () => import('./i18n/lang-en'), es: () => import('./i18n/lang-es') };
const cache = { it };
export const LANGS = ['it', 'en', 'es'];

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lemo_lang');
    return LANGS.includes(saved) ? saved : 'it';
  });
  const [, setLoaded] = useState(0);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (cache[lang]) return;
    let alive = true;
    LOADERS[lang]().then((m) => { cache[lang] = m.default; if (alive) setLoaded((n) => n + 1); });
    return () => { alive = false; };
  }, [lang]);

  const switchLang = (code) => {
    if (!LANGS.includes(code)) return;
    localStorage.setItem('lemo_lang', code);
    if (cache[code]) { setLang(code); return; }
    LOADERS[code]().then((m) => { cache[code] = m.default; setLang(code); });
  };

  // finché la lingua salvata non è arrivata (una frazione di secondo) resta la schermata di caricamento
  const t = cache[lang];
  if (!t) return null;
  const u = ui[lang] || ui.it;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, u }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
