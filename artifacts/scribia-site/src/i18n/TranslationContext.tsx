import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ptBR } from './translations/pt-BR';
import { enUS } from './translations/en-US';
import { esES } from './translations/es-ES';

type Language = 'pt-BR' | 'en-US' | 'es-ES';
type Translations = typeof ptBR;

const translations: Record<Language, Translations> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es-ES': esES,
};

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language') as Language;
    return saved || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};
