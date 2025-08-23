// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../utils/i18n/locales/en.json';
import id from '../utils/i18n/locales/id.json';

// Get initial language from localStorage, then URL params, else default 'id'
const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('equity_ui_lang');
      if (saved) return saved;
    } catch {
      // ignore
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') || 'id';
  }
  return 'id';
};

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, id: { translation: id } },
  lng: getInitialLanguage(),
  fallbackLng: 'id',
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  react: {
    useSuspense: false, // Disable suspense for better error handling
  },
});

export default i18n;

// Persist language changes and keep URL param synced
if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    try {
      localStorage.setItem('equity_ui_lang', lng);
    } catch {
      // ignore storage errors in private mode/tests
    }
    try {
      if (typeof window.history?.replaceState === 'function') {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lng);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore jsdom SecurityError during tests
    }
  });
}
