import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import id from './locales/id.json';

const getInitialLanguage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('equity_ui_lang');
      if (saved) return saved;
    } catch {
      void 0;
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
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    try {
      localStorage.setItem('equity_ui_lang', lng);
    } catch {
      void 0;
    }
    const url = new URL(window.location);
    url.searchParams.set('lang', lng);
    window.history.replaceState({}, '', url);
  });
}

export default i18n;
// Deprecated: use src/services/i18n.js
export {};
