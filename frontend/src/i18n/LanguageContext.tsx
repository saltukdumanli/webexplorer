/**
 * [TR] Dil Bağlamı (LanguageContext): Uygulama genelinde TR / EN dil durumunu yöneten ve çeviri fonksiyonu (t) sağlayan Context sağlayıcısı.
 * [EN] LanguageContext: Context provider managing TR / EN language state and providing the translation function (t) across the application.
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
});

const STORAGE_KEY_LANG = 'webexplorer_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_LANG) as Language;
      if (saved && (saved === 'tr' || saved === 'en')) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    }
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.tr;
    return dict[key] || translations.tr[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);
