import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Custom hook for dynamic UI translation
 * Automatically translates text when language changes
 */
export const useTranslatedText = (text, context = 'general', dependencies = []) => {
  const { currentLanguage, translateUI } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translate = async () => {
      if (!text || currentLanguage === 'english') {
        setTranslatedText(text);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translateUI(text, context);
        setTranslatedText(result);
      } catch (error) {
        console.error('Translation error:', error);
        setTranslatedText(text);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [text, currentLanguage, context, translateUI, ...dependencies]);

  return { translatedText, isTranslating };
};

/**
 * Custom hook for batch translation
 * Translates multiple texts at once
 */
export const useTranslatedTexts = (texts = [], context = 'general') => {
  const { currentLanguage, translateUIBatch } = useLanguage();
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translate = async () => {
      if (!texts.length || currentLanguage === 'english') {
        const defaultTranslations = texts.reduce((acc, text) => {
          acc[text] = text;
          return acc;
        }, {});
        setTranslations(defaultTranslations);
        return;
      }

      setIsTranslating(true);
      try {
        const result = await translateUIBatch(texts, context);
        setTranslations(result);
      } catch (error) {
        console.error('Batch translation error:', error);
        const defaultTranslations = texts.reduce((acc, text) => {
          acc[text] = text;
          return acc;
        }, {});
        setTranslations(defaultTranslations);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [JSON.stringify(texts), currentLanguage, context, translateUIBatch]);

  return { translations, isTranslating };
};

/**
 * Custom hook for component-level translation
 * Translates all text in a component structure
 */
export const useComponentTranslation = (componentTexts = {}, autoTranslate = true) => {
  const { currentLanguage, translateUIBatch } = useLanguage();
  const [translatedComponent, setTranslatedComponent] = useState(componentTexts);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!autoTranslate) return;

    const translate = async () => {
      if (!Object.keys(componentTexts).length || currentLanguage === 'english') {
        setTranslatedComponent(componentTexts);
        return;
      }

      setIsTranslating(true);
      try {
        // Extract all text values
        const texts = Object.values(componentTexts);
        const keys = Object.keys(componentTexts);

        // Translate batch
        const translations = await translateUIBatch(texts, 'general');

        // Reconstruct component with translations
        const translated = {};
        keys.forEach((key, index) => {
          translated[key] = translations[texts[index]] || texts[index];
        });

        setTranslatedComponent(translated);
      } catch (error) {
        console.error('Component translation error:', error);
        setTranslatedComponent(componentTexts);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [JSON.stringify(componentTexts), currentLanguage, autoTranslate, translateUIBatch]);

  return { translatedComponent, isTranslating };
};

/**
 * Custom hook for form field translation
 * Specifically for form labels, placeholders, and error messages
 */
export const useFormTranslation = (formFields = {}) => {
  const { currentLanguage, translateUIBatch } = useLanguage();
  const [translatedFields, setTranslatedFields] = useState(formFields);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translate = async () => {
      if (!Object.keys(formFields).length || currentLanguage === 'english') {
        setTranslatedFields(formFields);
        return;
      }

      setIsTranslating(true);
      try {
        // Extract all text from form fields
        const allTexts = [];
        const textMap = {};

        Object.entries(formFields).forEach(([fieldName, field]) => {
          if (field.label) {
            allTexts.push(field.label);
            textMap[field.label] = { fieldName, type: 'label' };
          }
          if (field.placeholder) {
            allTexts.push(field.placeholder);
            textMap[field.placeholder] = { fieldName, type: 'placeholder' };
          }
          if (field.helpText) {
            allTexts.push(field.helpText);
            textMap[field.helpText] = { fieldName, type: 'helpText' };
          }
        });

        // Translate all texts
        const translations = await translateUIBatch(allTexts, 'label');

        // Reconstruct form fields with translations
        const translated = JSON.parse(JSON.stringify(formFields));
        Object.entries(translations).forEach(([original, translatedText]) => {
          const info = textMap[original];
          if (info && translated[info.fieldName]) {
            translated[info.fieldName][info.type] = translatedText;
          }
        });

        setTranslatedFields(translated);
      } catch (error) {
        console.error('Form translation error:', error);
        setTranslatedFields(formFields);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [JSON.stringify(formFields), currentLanguage, translateUIBatch]);

  return { translatedFields, isTranslating };
};

/**
 * HOC to wrap components with automatic translation
 */
export const withTranslation = (WrappedComponent, textsToTranslate = []) => {
  return function TranslatedComponent(props) {
    const { translations, isTranslating } = useTranslatedTexts(textsToTranslate);

    return (
      <WrappedComponent
        {...props}
        translations={translations}
        isTranslating={isTranslating}
      />
    );
  };
};

export default useTranslatedText;
