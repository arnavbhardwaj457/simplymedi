import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslatedText, useTranslatedTexts, useFormTranslation } from '../../hooks/useTranslation';
import Card from '../../components/UI/Card';
import { 
  GlobeAltIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  LanguageIcon 
} from '@heroicons/react/24/outline';

/**
 * Demonstration page showing multilingual UI translation capabilities
 */
const MultilingualDemoPage = () => {
  const { currentLanguage, setLanguage, supportedLanguages, isRTL } = useLanguage();
  const [showDemo, setShowDemo] = useState(true);

  // Demo: Translate single text
  const { translatedText: welcomeText } = useTranslatedText(
    'Welcome to SimplyMedi Multilingual Demo',
    'general'
  );

  // Demo: Translate multiple texts
  const demoTexts = [
    'Medical Reports',
    'Book Appointment',
    'Chat with Doctor',
    'View History',
    'Upload Document',
    'Download Report'
  ];
  const { translations: menuTranslations } = useTranslatedTexts(demoTexts, 'button');

  // Demo: Form translation
  const formFields = {
    name: {
      label: 'Full Name',
      placeholder: 'Enter your full name',
      helpText: 'As it appears on your ID'
    },
    email: {
      label: 'Email Address',
      placeholder: 'your.email@example.com',
      helpText: 'We will send updates to this email'
    },
    phone: {
      label: 'Phone Number',
      placeholder: '+1 (555) 000-0000',
      helpText: 'Include country code'
    },
    symptoms: {
      label: 'Symptoms',
      placeholder: 'Describe your symptoms',
      helpText: 'Be as detailed as possible'
    }
  };
  const { translatedFields } = useFormTranslation(formFields);

  // Feature descriptions
  const features = [
    {
      title: 'AI-Powered Translation',
      description: 'Uses Google Gemini API for accurate, context-aware translations',
      icon: SparklesIcon,
      color: 'primary'
    },
    {
      title: 'Smart Caching',
      description: 'Translations are cached to reduce API calls and improve performance',
      icon: CheckCircleIcon,
      color: 'success'
    },
    {
      title: 'RTL Support',
      description: 'Full support for right-to-left languages like Arabic',
      icon: LanguageIcon,
      color: 'secondary'
    },
    {
      title: '14 Languages',
      description: 'Support for English, Hindi, Bengali, Tamil, Telugu, Arabic, Chinese, and more',
      icon: GlobeAltIcon,
      color: 'info'
    }
  ];

  const { translations: featureTranslations } = useTranslatedTexts(
    features.flatMap(f => [f.title, f.description]),
    'general'
  );

  return (
    <div className="space-y-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white shadow-strong">
        <div className="flex items-center space-x-4">
          <GlobeAltIcon className="h-12 w-12" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{welcomeText}</h1>
            <p className="text-primary-100">
              Experience real-time UI translation powered by Google Gemini API
            </p>
          </div>
        </div>
      </div>

      {/* Current Language Info */}
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Current Language</h2>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Active Language:</p>
              <p className="text-2xl font-bold text-primary-600">
                {supportedLanguages[currentLanguage]?.nativeName || currentLanguage}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Direction:</p>
              <p className="text-lg font-semibold text-gray-900">
                {isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(supportedLanguages).map(([key, lang]) => (
              <button
                key={key}
                onClick={() => setLanguage(key)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  currentLanguage === key
                    ? 'border-primary-600 bg-primary-50 text-primary-800 shadow-soft'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <p className="font-semibold text-sm">{lang.nativeName}</p>
                <p className="text-xs text-gray-500">{lang.name}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index}>
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-${feature.color}-100`}>
                    <Icon className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {featureTranslations[feature.title] || feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {featureTranslations[feature.description] || feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Demo: Translated Menu Items */}
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Translated Menu Items
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {demoTexts.map((text, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-200"
              >
                <p className="text-sm text-gray-500 mb-1">Original:</p>
                <p className="font-medium text-gray-900 mb-2">{text}</p>
                <p className="text-sm text-gray-500 mb-1">Translated:</p>
                <p className="font-semibold text-primary-600">
                  {menuTranslations[text] || text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Demo: Translated Form */}
      {showDemo && (
        <Card>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Translated Form Demo
              </h2>
              <button
                onClick={() => setShowDemo(!showDemo)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Toggle Demo
              </button>
            </div>
          </div>
          <div className="card-body">
            <form className="space-y-6">
              {Object.entries(translatedFields).map(([fieldName, field]) => (
                <div key={fieldName}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <input
                    type={fieldName === 'email' ? 'email' : fieldName === 'phone' ? 'tel' : 'text'}
                    placeholder={field.placeholder}
                    className="input"
                    disabled
                  />
                  {field.helpText && (
                    <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                  )}
                </div>
              ))}
            </form>
          </div>
        </Card>
      )}

      {/* Implementation Guide */}
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            How to Use
          </h2>
        </div>
        <div className="card-body">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              1. Single Text Translation
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto mb-6">
{`import { useTranslatedText } from '../../hooks/useTranslation';

const { translatedText } = useTranslatedText('Welcome', 'general');`}
            </pre>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              2. Batch Translation
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto mb-6">
{`import { useTranslatedTexts } from '../../hooks/useTranslation';

const texts = ['Home', 'About', 'Contact'];
const { translations } = useTranslatedTexts(texts, 'navigation');`}
            </pre>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              3. Form Translation
            </h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`import { useFormTranslation } from '../../hooks/useTranslation';

const formFields = {
  name: { label: 'Name', placeholder: 'Enter name' }
};
const { translatedFields } = useFormTranslation(formFields);`}
            </pre>
          </div>
        </div>
      </Card>

      {/* API Endpoints */}
      <Card>
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Available API Endpoints
          </h2>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <p className="font-mono text-sm text-primary-600 font-semibold">
                POST /api/languages/translate-ui
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Translate single UI text with context awareness
              </p>
            </div>
            <div className="border-l-4 border-success-500 pl-4">
              <p className="font-mono text-sm text-success-600 font-semibold">
                POST /api/languages/translate-batch
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Translate multiple texts in a single request
              </p>
            </div>
            <div className="border-l-4 border-secondary-500 pl-4">
              <p className="font-mono text-sm text-secondary-600 font-semibold">
                POST /api/languages/translate-component
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Translate entire component structure
              </p>
            </div>
            <div className="border-l-4 border-info-500 pl-4">
              <p className="font-mono text-sm text-info-600 font-semibold">
                GET /api/languages/formatting-rules/:language
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Get language-specific formatting rules
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MultilingualDemoPage;
