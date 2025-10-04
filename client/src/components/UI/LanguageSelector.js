import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSelector = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState({});
  const { currentLanguage, setLanguage, t } = useLanguage();

  useEffect(() => {
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await fetch('/api/languages/supported');
      const data = await response.json();
      setLanguages(data.languages);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const handleLanguageChange = async (languageKey) => {
    setLanguage(languageKey);
    setIsOpen(false);
  };

  const currentLangInfo = languages[currentLanguage] || { name: 'English', nativeName: 'English' };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-secondary-700 bg-white/80 backdrop-blur-sm border border-brown-200 rounded-lg hover:bg-brown-50 hover:border-brown-300 transition-all duration-200 hover:scale-105"
      >
        <GlobeAltIcon className="w-4 h-4 text-brown-600" />
        <span className="hidden sm:inline">{currentLangInfo.nativeName}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md border border-brown-200 rounded-lg shadow-strong z-20 animate-slide-down">
            <div className="p-2">
              <div className="text-xs font-medium text-secondary-600 px-3 py-2 border-b border-brown-100 mb-2">
                {t('selectLanguage')}
              </div>
              
              <div className="max-h-64 overflow-y-auto scrollbar-hide">
                {Object.entries(languages).map(([key, lang]) => (
                  <button
                    key={key}
                    onClick={() => handleLanguageChange(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200 hover:bg-brown-50 hover:scale-105 ${
                      currentLanguage === key
                        ? 'bg-brown-100 text-brown-800 font-medium'
                        : 'text-secondary-700 hover:text-brown-800'
                    }`}
                  >
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-secondary-500">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;