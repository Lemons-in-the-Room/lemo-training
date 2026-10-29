/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import { translations } from './i18n/translations';
import { ui } from './i18n/ui';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('lemo_lang');
    return translations[saved] ? saved : 'it';
  });

  const switchLang = (code) => {
    if (!translations[code]) return;
    setLang(code);
    localStorage.setItem('lemo_lang', code);
    document.documentElement.lang = code;
  };

  const t = translations[lang];
  const u = ui[lang] || ui.it;

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t, u }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
