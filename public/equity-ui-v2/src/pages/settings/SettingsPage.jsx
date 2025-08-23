import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/Card';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  rememberInSession,
  getApiKey,
  setApiKey,
} from '../../services/auth/tokenManager';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [token, setToken] = React.useState(() => getAccessToken() || '');
  const [remember, setRemember] = React.useState(() => {
    try {
      return sessionStorage.getItem('equity_ui_remember_session_token') === '1';
    } catch {
      return false;
    }
  });
  const [apiKey, setApiKeyLocal] = React.useState(() => getApiKey() || '');
  const [lang, setLang] = React.useState(i18n.language || 'id');

  const onSaveToken = (e) => {
    e.preventDefault();
    rememberInSession(remember);
    setAccessToken(token);
  };

  const onClearToken = () => {
    clearAccessToken();
    setToken('');
  };

  const onSaveApiKey = (e) => {
    e.preventDefault();
    setApiKey(apiKey);
  };

  const onLangChange = (e) => {
    const newLang = e.target.value;
    setLang(newLang);
    i18n.changeLanguage(newLang);
    try {
      localStorage.setItem('equity_ui_lang', newLang);
    } catch {
      // ignore
    }
    const url = new URL(window.location);
    url.searchParams.set('lang', newLang);
    window.history.pushState({}, '', url);
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {t('settings.title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card title={t('settings.access_token')}>
          <form onSubmit={onSaveToken} className="space-y-3">
            <label
              htmlFor="access-token"
              className="block text-sm text-gray-600 dark:text-gray-400"
            >
              {t('settings.token')}
            </label>
            <input
              id="access-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={t('settings.paste_token')}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t('settings.remember_session')}</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('settings.save_token')}
              </button>
              <button
                type="button"
                onClick={onClearToken}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {t('settings.clear')}
              </button>
            </div>
          </form>
        </Card>

  <Card title={t('settings.api_key_card')}>
          <form onSubmit={onSaveApiKey} className="space-y-3">
            <label htmlFor="api-key" className="block text-sm text-gray-600 dark:text-gray-400">
              {t('settings.api_key')}
            </label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder={t('settings.api_key_placeholder')}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {t('settings.save_api_key')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setApiKey('');
                  setApiKeyLocal('');
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {t('settings.clear')}
              </button>
            </div>
          </form>
        </Card>

        <Card title={t('settings.language')}>
          <div className="space-y-3">
            <label
              htmlFor="language-select"
              className="block text-sm text-gray-600 dark:text-gray-400"
            >
              {t('settings.language')}
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={onLangChange}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="id">{t('settings.lang_id')}</option>
              <option value="en">{t('settings.lang_en')}</option>
            </select>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default SettingsPage;
