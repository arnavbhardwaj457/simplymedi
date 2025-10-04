# 🌍 SimplyMedi Multilingual Integration

## Overview

SimplyMedi now features comprehensive multilingual support powered by Google Gemini API, enabling dynamic UI translation across 14 languages with intelligent context-awareness and RTL (Right-to-Left) support.

## ✨ Features

### 1. **AI-Powered Translation**
- Uses Google Gemini API for accurate, context-aware translations
- Understands medical, UI/UX, and general terminology
- Maintains tone, formality, and cultural appropriateness

### 2. **Smart Caching**
- Translations are cached for 24 hours
- Reduces API calls and improves performance
- In-memory cache with automatic expiration

### 3. **Context-Aware Translation**
- Different contexts: `general`, `medical`, `button`, `label`, `navigation`, `message`
- Preserves placeholders like `{name}`, `{count}`
- Handles technical terms appropriately

### 4. **RTL Language Support**
- Full support for Arabic and other RTL languages
- Automatic direction switching
- RTL-specific CSS utilities

### 5. **14 Supported Languages**
- **English** (English)
- **Hindi** (हिन्दी)
- **Bengali** (বাংলা)
- **Tamil** (தமிழ்)
- **Telugu** (తెలుగు)
- **Kannada** (ಕನ್ನಡ)
- **Marathi** (मराठी)
- **Gujarati** (ગુજરાતી)
- **Punjabi** (ਪੰਜਾਬੀ)
- **Arabic** (العربية)
- **French** (Français)
- **Spanish** (Español)
- **Chinese** (中文)
- **German** (Deutsch)

---

## 🚀 Quick Start

### Backend Setup

1. **Ensure Gemini API Key is set** in `.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

2. **Translation Service is auto-loaded** in `server/services/translationService.js`

3. **API endpoints are available** at `/api/languages/*`

### Frontend Usage

#### 1. Single Text Translation

```javascript
import { useTranslatedText } from '../../hooks/useTranslation';

const MyComponent = () => {
  const { translatedText, isTranslating } = useTranslatedText(
    'Welcome to SimplyMedi',
    'general'
  );

  return <h1>{translatedText}</h1>;
};
```

#### 2. Batch Translation

```javascript
import { useTranslatedTexts } from '../../hooks/useTranslation';

const MyComponent = () => {
  const texts = ['Home', 'About', 'Services', 'Contact'];
  const { translations, isTranslating } = useTranslatedTexts(texts, 'navigation');

  return (
    <nav>
      {texts.map(text => (
        <a key={text}>{translations[text] || text}</a>
      ))}
    </nav>
  );
};
```

#### 3. Form Translation

```javascript
import { useFormTranslation } from '../../hooks/useTranslation';

const MyForm = () => {
  const formFields = {
    name: {
      label: 'Full Name',
      placeholder: 'Enter your name',
      helpText: 'As shown on ID'
    },
    email: {
      label: 'Email',
      placeholder: 'your@email.com'
    }
  };

  const { translatedFields, isTranslating } = useFormTranslation(formFields);

  return (
    <form>
      {Object.entries(translatedFields).map(([name, field]) => (
        <div key={name}>
          <label>{field.label}</label>
          <input placeholder={field.placeholder} />
          {field.helpText && <p>{field.helpText}</p>}
        </div>
      ))}
    </form>
  );
};
```

#### 4. Component-Level Translation

```javascript
import { useComponentTranslation } from '../../hooks/useTranslation';

const MyComponent = () => {
  const componentTexts = {
    title: 'Dashboard',
    subtitle: 'Welcome back',
    buttonText: 'Get Started',
    description: 'Manage your health records'
  };

  const { translatedComponent } = useComponentTranslation(componentTexts);

  return (
    <div>
      <h1>{translatedComponent.title}</h1>
      <h2>{translatedComponent.subtitle}</h2>
      <p>{translatedComponent.description}</p>
      <button>{translatedComponent.buttonText}</button>
    </div>
  );
};
```

---

## 📡 API Endpoints

### 1. Get Supported Languages
```http
GET /api/languages/supported
```

**Response:**
```json
{
  "languages": {
    "english": {
      "name": "English",
      "nativeName": "English",
      "code": "en"
    },
    "hindi": {
      "name": "Hindi",
      "nativeName": "हिन्दी",
      "code": "hi"
    }
    // ... more languages
  },
  "count": 14
}
```

### 2. Translate UI Text
```http
POST /api/languages/translate-ui
Content-Type: application/json

{
  "text": "Welcome to SimplyMedi",
  "targetLanguage": "hindi",
  "context": "general"
}
```

**Response:**
```json
{
  "originalText": "Welcome to SimplyMedi",
  "translatedText": "सिंपलीमेडी में आपका स्वागत है",
  "targetLanguage": "hindi",
  "context": "general",
  "formattingRules": {
    "direction": "ltr",
    "numberFormat": "hi-IN",
    "dateFormat": "hi-IN",
    "currency": "INR"
  }
}
```

### 3. Translate Batch
```http
POST /api/languages/translate-batch
Content-Type: application/json

{
  "texts": ["Home", "About", "Contact"],
  "targetLanguage": "french",
  "context": "navigation"
}
```

**Response:**
```json
{
  "translations": {
    "Home": "Accueil",
    "About": "À propos",
    "Contact": "Contact"
  },
  "targetLanguage": "french",
  "context": "navigation",
  "count": 3
}
```

### 4. Translate Component
```http
POST /api/languages/translate-component
Content-Type: application/json

{
  "component": {
    "title": "Dashboard",
    "description": "Manage your health",
    "buttons": {
      "save": "Save",
      "cancel": "Cancel"
    }
  },
  "targetLanguage": "spanish"
}
```

**Response:**
```json
{
  "originalComponent": { /* ... */ },
  "translatedComponent": {
    "title": "Panel de Control",
    "description": "Gestiona tu salud",
    "buttons": {
      "save": "Guardar",
      "cancel": "Cancelar"
    }
  },
  "targetLanguage": "spanish"
}
```

### 5. Get Formatting Rules
```http
GET /api/languages/formatting-rules/arabic
```

**Response:**
```json
{
  "language": "arabic",
  "languageInfo": {
    "name": "Arabic",
    "nativeName": "العربية",
    "code": "ar"
  },
  "formattingRules": {
    "direction": "rtl",
    "numberFormat": "ar-SA",
    "dateFormat": "ar-SA",
    "currency": "SAR"
  }
}
```

### 6. Clear Translation Cache
```http
POST /api/languages/clear-cache
```

**Response:**
```json
{
  "success": true,
  "message": "Translation cache cleared successfully"
}
```

---

## 🎨 RTL Support

### Automatic Direction Switching

The `LanguageProvider` automatically wraps children in RTL mode for Arabic:

```javascript
<LanguageProvider>
  <div className={isRTL ? 'rtl' : 'ltr'}>
    {/* Your app */}
  </div>
</LanguageProvider>
```

### CSS Utilities for RTL

```css
/* Custom RTL utilities */
[dir="rtl"] {
  direction: rtl;
}

[dir="rtl"] .rtl\:text-right {
  text-align: right;
}

[dir="rtl"] .rtl\:ml-auto {
  margin-left: auto;
  margin-right: 0;
}
```

### Using RTL in Components

```javascript
import { useLanguage } from '../../contexts/LanguageContext';

const MyComponent = () => {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <p className={isRTL ? 'text-right' : 'text-left'}>
        Content respects direction
      </p>
    </div>
  );
};
```

---

## 🔧 Advanced Features

### Context Types

Use appropriate context for better translations:

- `general` - General application text
- `medical` - Medical terminology
- `button` - Button labels and actions
- `label` - Form labels and field names
- `navigation` - Menu and navigation items
- `message` - Notifications and messages

### Caching Strategy

Translations are cached with the following key format:
```
{originalText}_{targetLanguage}_{context}
```

Cache expires after 24 hours. Clear manually via API if needed.

### Performance Optimization

1. **Use batch translation** for multiple texts
2. **Leverage caching** by reusing common phrases
3. **Avoid translating technical terms** (API names, code, etc.)
4. **Use context** to get more accurate translations

---

## 📊 Language Statistics

Get translation statistics:

```http
GET /api/languages/stats
```

**Response:**
```json
{
  "stats": {
    "mostUsedLanguage": "english",
    "translationsCount": 0,
    "simplificationsCount": 0,
    "supportedLanguagesCount": 14,
    "cacheSize": 42
  }
}
```

---

## 🧪 Testing

### Test Translation Service

```javascript
// In browser console or React component
const testTranslation = async () => {
  const response = await fetch('/api/languages/translate-ui', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Hello World',
      targetLanguage: 'hindi',
      context: 'general'
    })
  });
  
  const data = await response.json();
  console.log(data.translatedText); // नमस्ते दुनिया
};
```

### Demo Page

Visit the multilingual demo page to see all features in action:
```
/app/multilingual-demo
```

---

## 🚨 Error Handling

All translation functions gracefully fallback to original text on error:

```javascript
const { translatedText } = useTranslatedText('Hello');
// If translation fails, translatedText = 'Hello'
```

---

## 📝 Best Practices

### ✅ DO:
- Use batch translation for multiple texts
- Specify appropriate context
- Leverage caching for common phrases
- Handle loading states with `isTranslating`
- Test with different languages, especially RTL

### ❌ DON'T:
- Translate technical terms or code
- Make excessive API calls (use batch)
- Ignore RTL considerations
- Assume translations are instant
- Hardcode language-specific logic

---

## 🔐 Security

- Translation API endpoints are **public** (no auth required)
- Gemini API key is **server-side only**
- No sensitive data should be sent for translation
- Cache is in-memory (cleared on server restart)

---

## 🐛 Troubleshooting

### Translation not working?

1. Check Gemini API key in `.env`
2. Verify network connection
3. Check browser console for errors
4. Clear cache: `POST /api/languages/clear-cache`

### RTL not displaying correctly?

1. Ensure `dir` attribute is set on parent div
2. Check CSS imports in `index.css`
3. Verify `isRTL` from `useLanguage()`

### Slow translation?

1. Use batch translation instead of multiple single calls
2. Leverage caching by using common phrases
3. Check Gemini API rate limits

---

## 📚 Resources

- **Gemini API Docs**: https://ai.google.dev/docs
- **i18next**: https://www.i18next.com/
- **React i18next**: https://react.i18next.com/
- **RTL CSS**: https://rtlstyling.com/

---

## 🎯 Future Enhancements

- [ ] User-specific translation preferences
- [ ] Offline translation support
- [ ] Voice-based language input
- [ ] Auto-detect language from text
- [ ] Translation quality feedback
- [ ] Custom terminology dictionary
- [ ] Translation history tracking

---

## 📞 Support

For issues or questions about multilingual integration:
- Create an issue on GitHub
- Contact: support@simplymedi.com
- Check demo page: `/app/multilingual-demo`

---

## 📄 License

Same as SimplyMedi project license.

---

**Built with ❤️ using Google Gemini API**
