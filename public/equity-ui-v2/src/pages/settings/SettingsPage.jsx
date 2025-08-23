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
  const { i18n } = useTranslation();
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
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Access Token">
          <form onSubmit={onSaveToken} className="space-y-3">
            <label htmlFor="access-token" className="block text-sm text-gray-600 dark:text-gray-400">
              Token
            </label>
            <input
              id="access-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token"
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember in this session</span>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Token
              </button>
              <button
                type="button"
                onClick={onClearToken}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        <Card title="API Key">
          <form onSubmit={onSaveApiKey} className="space-y-3">
            <label htmlFor="api-key" className="block text-sm text-gray-600 dark:text-gray-400">
              API Key
            </label>
            <input
              id="api-key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder="API key (optional)"
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save API Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setApiKey('');
                  setApiKeyLocal('');
                }}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </form>
        </Card>

        <Card title="Language">
          <div className="space-y-3">
            <label htmlFor="language-select" className="block text-sm text-gray-600 dark:text-gray-400">
              Language
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={onLangChange}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </Card>
      </div>
    </main>
  );
};

export default SettingsPage;
