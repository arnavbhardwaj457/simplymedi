import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';
import pa from './locales/pa.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';

const resources = {
  english: { translation: en },
  hindi: { translation: hi },
  bengali: { translation: bn },
  tamil: { translation: ta },
  telugu: { translation: te },
  kannada: { translation: kn },
  marathi: { translation: mr },
  gujarati: { translation: gu },
  punjabi: { translation: pa },
  arabic: { translation: ar },
  french: { translation: fr },
  mandarin: { translation: zh },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'english', // default language
    fallbackLng: 'english',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    // React configuration
    react: {
      useSuspense: false,
    },
  });

export default i18n;
