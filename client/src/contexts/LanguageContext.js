import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import i18n from '../i18n';
import api from '../services/api';

const LanguageContext = createContext();

const initialState = {
  currentLanguage: 'english',
  supportedLanguages: {},
  loading: false,
  error: null,
  isRTL: false,
  preferences: {
    autoTranslate: true,
    translationQuality: 'balanced',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'en-US',
    currency: 'USD',
    timezone: 'UTC',
  },
  translations: {},
};

const languageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SUPPORTED_LANGUAGES':
      return { ...state, supportedLanguages: action.payload, loading: false };
    
    case 'SET_LANGUAGE':
      const isRTL = action.payload === 'arabic';
      // Update i18n language
      i18n.changeLanguage(action.payload);
      // Save to localStorage
      localStorage.setItem('selectedLanguage', action.payload);
      return {
        ...state,
        currentLanguage: action.payload,
        isRTL: isRTL,
      };
    
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    
    case 'SET_TRANSLATIONS':
      return {
        ...state,
        translations: { ...state.translations, ...action.payload },
      };
    
    default:
      return state;
  }
};

export const LanguageProvider = ({ children }) => {
  const [state, dispatch] = useReducer(languageReducer, initialState);

  // Load supported languages from API
  const loadSupportedLanguages = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch('/api/languages/supported');
      const data = await response.json();
      dispatch({ type: 'SET_SUPPORTED_LANGUAGES', payload: data.languages });
    } catch (error) {
      console.error('Failed to load supported languages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load languages' });
    }
  }, []);

  // Initialize language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'english';
    dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
    loadSupportedLanguages();
  }, [loadSupportedLanguages]);

  // Set language
  const setLanguage = useCallback(async (languageCode) => {
    try {
      dispatch({ type: 'SET_LANGUAGE', payload: languageCode });
      
      // Update user preferences if authenticated
      try {
        await api.patch('/users/language-preferences', {
          primaryLanguage: languageCode,
          interfaceLanguage: languageCode,
          reportLanguage: languageCode,
          chatLanguage: languageCode,
        });
      } catch (error) {
        // Silently fail if not authenticated
        console.warn('Could not save language preference:', error);
      }
    } catch (error) {
      console.error('Failed to set language:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to set language' });
    }
  }, []);

  // Translate text
  const translateText = useCallback(async (text, targetLanguage, sourceLanguage = 'auto') => {
    try {
      const response = await fetch('/api/languages/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }
      
      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on failure
    }
  }, []);

  // Detect language
  const detectLanguage = useCallback(async (text) => {
    try {
      const response = await fetch('/api/languages/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        throw new Error('Language detection failed');
      }
      
      const data = await response.json();
      return data.detectedLanguage;
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'english'; // Default to English
    }
  }, []);

  // Simplify medical text
  const simplifyMedicalText = useCallback(async (text, targetLanguage = state.currentLanguage) => {
    try {
      const response = await fetch('/api/languages/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Simplification failed');
      }
      
      const data = await response.json();
      return data.simplifiedText;
    } catch (error) {
      console.error('Medical text simplification failed:', error);
      return text; // Return original text on failure
    }
  }, [state.currentLanguage]);

  // Translate UI text dynamically
  const translateUI = useCallback(async (text, context = 'general') => {
    try {
      // Skip if already in English
      if (state.currentLanguage === 'english') {
        return text;
      }

      // Check cache first
      const cacheKey = `${text}_${state.currentLanguage}_${context}`;
      if (state.translations[cacheKey]) {
        return state.translations[cacheKey];
      }

      const response = await fetch('/api/languages/translate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage: state.currentLanguage,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error('UI translation failed');
      }
      
      const data = await response.json();
      
      // Cache the translation
      dispatch({ 
        type: 'SET_TRANSLATIONS', 
        payload: { [cacheKey]: data.translatedText } 
      });
      
      return data.translatedText;
    } catch (error) {
      console.error('UI translation failed:', error);
      return text; // Return original text on failure
    }
  }, [state.currentLanguage, state.translations]);

  // Translate multiple UI texts in batch
  const translateUIBatch = useCallback(async (texts, context = 'general') => {
    try {
      // Skip if already in English
      if (state.currentLanguage === 'english') {
        return texts.reduce((acc, text) => {
          acc[text] = text;
          return acc;
        }, {});
      }

      const response = await fetch('/api/languages/translate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          targetLanguage: state.currentLanguage,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Batch UI translation failed');
      }
      
      const data = await response.json();
      
      // Cache all translations
      const cacheUpdates = {};
      Object.entries(data.translations).forEach(([key, value]) => {
        const cacheKey = `${key}_${state.currentLanguage}_${context}`;
        cacheUpdates[cacheKey] = value;
      });
      
      dispatch({ 
        type: 'SET_TRANSLATIONS', 
        payload: cacheUpdates 
      });
      
      return data.translations;
    } catch (error) {
      console.error('Batch UI translation failed:', error);
      return texts.reduce((acc, text) => {
        acc[text] = text;
        return acc;
      }, {});
    }
  }, [state.currentLanguage]);

  // Get formatting rules for current language
  const getFormattingRules = useCallback(async () => {
    try {
      const response = await fetch(`/api/languages/formatting-rules/${state.currentLanguage}`);
      
      if (!response.ok) {
        throw new Error('Failed to get formatting rules');
      }
      
      const data = await response.json();
      return data.formattingRules;
    } catch (error) {
      console.error('Failed to get formatting rules:', error);
      return {
        direction: 'ltr',
        numberFormat: 'en-US',
        dateFormat: 'en-US',
        currency: 'USD'
      };
    }
  }, [state.currentLanguage]);

  // Translation helper with caching
  const t = useCallback((key, params = {}) => {
    try {
      let translation = i18n.t(key, params);
      
      // If translation is same as key (not found), try to get from our translations cache
      if (translation === key && state.translations[key]) {
        translation = state.translations[key];
      }
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }, [state.translations]);

  // Format date according to user preferences
  const formatDate = useCallback((date, format = state.preferences.dateFormat) => {
    try {
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      
      if (state.preferences.timeFormat === '24h') {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
      }
      
      return new Intl.DateTimeFormat(
        state.supportedLanguages[state.currentLanguage]?.code || 'en-US',
        options
      ).format(new Date(date));
    } catch (error) {
      console.error('Date formatting error:', error);
      return date.toString();
    }
  }, [state.currentLanguage, state.preferences, state.supportedLanguages]);

  // Format number according to user preferences
  const formatNumber = useCallback((number) => {
    try {
      return new Intl.NumberFormat(
        state.preferences.numberFormat
      ).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString();
    }
  }, [state.preferences.numberFormat]);

  const value = {
    // State
    currentLanguage: state.currentLanguage,
    supportedLanguages: state.supportedLanguages,
    isRTL: state.isRTL,
    loading: state.loading,
    error: state.error,
    preferences: state.preferences,
    
    // Actions
    setLanguage,
    translateText,
    detectLanguage,
    simplifyMedicalText,
    loadSupportedLanguages,
    translateUI,
    translateUIBatch,
    getFormattingRules,
    
    // Helpers
    t,
    formatDate,
    formatNumber,
    
    // Dispatch for preferences
    setPreferences: (prefs) => dispatch({ type: 'SET_PREFERENCES', payload: prefs }),
  };

  return (
    <LanguageContext.Provider value={value}>
      <div className={state.isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
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

export default LanguageContext;