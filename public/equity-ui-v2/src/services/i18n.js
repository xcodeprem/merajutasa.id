// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
const translations = {
  id: {
    translation: {
      'badge.fairness': 'keadilan',
      'badge.under': 'under-served',
      'badge.anoms': 'anomali',
      'badge.revoc': 'pencabutan',
      'heading.under': 'Under-served',
      'heading.kpi': 'Ringkasan KPI',
      'heading.weekly': 'Tren Mingguan',
      'heading.monthly': 'Umpan Balik Bulanan',
      'label.updated': 'Terakhir diperbarui:',
      'link.methodology': 'Metodologi: Hysteresis & Under-Served',
      'link.privacy': 'FAQ Privasi',
      'snapshots.index': 'Indeks snapshot',
      'decision.mix.na': 'komposisi keputusan: n/a',
      'spark.na': 'sparkline: n/a',
      'monthly.latest': 'Bulan terbaru',
      'monthly.total': 'Total',
      'monthly.avglen': 'Rata2 panjang',
      'monthly.categories': 'Kategori',
      'monthly.pii': 'PII',
      'dashboard.title': 'Dashboard Ekuitas H1',
      'dashboard.subtitle': 'Sistem pemantauan transparansi dan keadilan',
      loading: 'Memuat...',
      error: 'Terjadi kesalahan',
      retry: 'Coba lagi',
      language: 'Bahasa',
      theme: 'Tema',
      light: 'Terang',
      dark: 'Gelap',
      menu: 'Menu',
      navigation: 'Navigasi',
      'accessibility.skipToContent': 'Lewati ke konten utama',
      'accessibility.menu': 'Menu navigasi',
      'accessibility.close': 'Tutup',
      'risk.title': 'Ringkasan Risiko',
      'risk.collector': 'Kolektor',
      'risk.chain': 'Rantai',
      'risk.privacy': 'Privasi',
    },
  },
  en: {
    translation: {
      'badge.fairness': 'fairness',
      'badge.under': 'under-served',
      'badge.anoms': 'anomalies',
      'badge.revoc': 'revocations',
      'heading.under': 'Under-served',
      'heading.kpi': 'KPI Summary',
      'heading.weekly': 'Weekly Trends',
      'heading.monthly': 'Monthly Feedback',
      'label.updated': 'Last updated:',
      'link.methodology': 'Methodology: Hysteresis & Under-Served',
      'link.privacy': 'Privacy FAQ',
      'snapshots.index': 'Snapshots index',
      'decision.mix.na': 'decision mix: n/a',
      'spark.na': 'sparkline: n/a',
      'monthly.latest': 'Latest month',
      'monthly.total': 'Total',
      'monthly.avglen': 'Avg length',
      'monthly.categories': 'Categories',
      'monthly.pii': 'PII',
      'dashboard.title': 'H1 Equity Dashboard',
      'dashboard.subtitle': 'Transparency and fairness monitoring system',
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      menu: 'Menu',
      navigation: 'Navigation',
      'accessibility.skipToContent': 'Skip to main content',
      'accessibility.menu': 'Navigation menu',
      'accessibility.close': 'Close',
      'risk.title': 'Risk Summary',
      'risk.collector': 'Collector',
      'risk.chain': 'Chain',
      'risk.privacy': 'Privacy',
    },
  },
};

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
  resources: translations,
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
      // ignore
    }
    const url = new URL(window.location);
    url.searchParams.set('lang', lng);
    window.history.replaceState({}, '', url);
  });
}
