import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

const initialState = {
  currentLanguage: 'english',
  supportedLanguages: [
    { code: 'english', name: 'English', nativeName: 'English' },
    { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bengali', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'marathi', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'gujarati', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'punjabi', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'arabic', name: 'Arabic', nativeName: 'العربية' },
    { code: 'french', name: 'French', nativeName: 'Français' },
    { code: 'mandarin', name: 'Mandarin', nativeName: '中文' },
  ],
  isRTL: false,
  preferences: {
    autoTranslate: true,
    translationQuality: 'balanced', // fast, balanced, accurate
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h', // 12h, 24h
    numberFormat: 'en-US',
    currency: 'USD',
    timezone: 'UTC',
  },
};

const languageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return {
        ...state,
        currentLanguage: action.payload,
        isRTL: action.payload === 'arabic',
      };
    
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    
    case 'SET_RTL':
      return {
        ...state,
        isRTL: action.payload,
      };
    
    case 'LOAD_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    
    default:
      return state;
  }
};

export const LanguageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(languageReducer, initialState);

  const setLanguage = useCallback((languageCode) => {
    if (state.supportedLanguages.find(lang => lang.code === languageCode)) {
      dispatch({ type: 'SET_LANGUAGE', payload: languageCode });
      localStorage.setItem('preferredLanguage', languageCode);
      
      // Update i18n language if available
      if (i18n.hasResourceBundle(languageCode, 'translation')) {
        i18n.changeLanguage(languageCode);
      }
    }
  }, [state.supportedLanguages]);

  // Load language preferences from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const savedPreferences = localStorage.getItem('languagePreferences');

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'LOAD_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to parse language preferences:', error);
      }
    }
  }, [setLanguage]);

  // Update document direction when RTL changes
  useEffect(() => {
    document.documentElement.dir = state.isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = state.currentLanguage;
  }, [state.isRTL, state.currentLanguage]);

  const setPreferences = (preferences) => {
    dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    localStorage.setItem('languagePreferences', JSON.stringify(preferences));
  };

  const getLanguageName = (languageCode) => {
    const language = state.supportedLanguages.find(lang => lang.code === languageCode);
    return language ? language.name : languageCode;
  };

  const getNativeLanguageName = (languageCode) => {
    const language = state.supportedLanguages.find(lang => lang.code === languageCode);
    return language ? language.nativeName : languageCode;
  };

  const formatDate = (date, options = {}) => {
    const { timeFormat } = state.preferences;
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    if (timeFormat === '24h') {
      defaultOptions.hour = '2-digit';
      defaultOptions.minute = '2-digit';
      defaultOptions.hour12 = false;
    } else {
      defaultOptions.hour = 'numeric';
      defaultOptions.minute = '2-digit';
      defaultOptions.hour12 = true;
    }

    const formatOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat(state.currentLanguage, formatOptions).format(new Date(date));
  };

  const formatNumber = (number, options = {}) => {
    const { numberFormat } = state.preferences;
    return new Intl.NumberFormat(numberFormat, options).format(number);
  };

  const formatCurrency = (amount, currency = null) => {
    const { currency: defaultCurrency } = state.preferences;
    return new Intl.NumberFormat(state.currentLanguage, {
      style: 'currency',
      currency: currency || defaultCurrency,
    }).format(amount);
  };

  const translateText = async (text, targetLanguage = null) => {
    if (!state.preferences.autoTranslate) {
      return text;
    }

    const target = targetLanguage || state.currentLanguage;
    
    if (target === 'english') {
      return text;
    }

    try {
      // This would integrate with your translation service
      // For now, return the original text
      return text;
    } catch (error) {
      console.error('Translation failed:', error);
      return text;
    }
  };

  const value = {
    ...state,
    setLanguage,
    setPreferences,
    getLanguageName,
    getNativeLanguageName,
    formatDate,
    formatNumber,
    formatCurrency,
    translateText,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
