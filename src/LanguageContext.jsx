/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import it from './i18n/lang-it';
import { ui } from './i18n/ui';
import { applyOverrides, fetchOverrides, readCachedOverrides } from './i18n/overrides';

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
  const [loaded, setLoaded] = useState(0);
  // testi modificati dalla dashboard: subito quelli già salvati sul dispositivo, poi la versione aggiornata
  const [overrides, setOverrides] = useState(readCachedOverrides);
  useEffect(() => {
    let alive = true;
    fetchOverrides().then((rows) => { if (alive && rows) setOverrides(rows); });
    const onChange = () => fetchOverrides().then((rows) => { if (rows) setOverrides(rows); });
    window.addEventListener('lemo-texts-changed', onChange);
    return () => { alive = false; window.removeEventListener('lemo-texts-changed', onChange); };
  }, []);

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
  const base = cache[lang];
  const { t, u } = useMemo(
    () => (base ? applyOverrides(base, ui[lang] || ui.it, overrides, lang) : { t: null, u: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, lang, overrides, loaded],
  );
  if (!t) return null;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, u }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
