// Header component with navigation and controls
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../stores/ThemeContext';
import {
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(newLang);

    // Update URL parameter
    const url = new URL(window.location);
    url.searchParams.set('lang', newLang);
    window.history.pushState({}, '', url);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.title')}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                {t('dashboard.subtitle')}
              </p>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav
            className="hidden md:flex items-center space-x-4"
            aria-label="Primary Navigation"
            role="navigation"
          >
            <a
              href="#/analytics"
              className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
            >
              {t('nav.analytics')}
            </a>
            <a
              href="#/compliance"
              className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
            >
              {t('nav.compliance')}
            </a>
            <a
              href="#/settings"
              className="text-sm text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
            >
              {t('nav.settings')}
            </a>
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label={`${t('language')}: ${i18n.language.toUpperCase()}`}
            >
              <LanguageIcon className="h-5 w-5" />
              <span className="ml-1 text-sm font-medium">{i18n.language.toUpperCase()}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label={`${t('theme')}: ${theme === 'light' ? t('light') : t('dark')}`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5" />
              ) : (
                <SunIcon className="h-5 w-5" />
              )}
            </button>

            {/* External links */}
            <a
              href="/equity-ui/ui/methodology"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {t('link.methodology')}
            </a>
            <a
              href="/equity-ui/ui/privacy-faq"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {t('link.privacy')}
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label={t('accessibility.menu')}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <nav
            id="mobile-menu"
            className="md:hidden border-t border-gray-200 dark:border-gray-700 py-2"
            aria-label="Primary Navigation"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile controls */}
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
                >
                  <LanguageIcon className="h-5 w-5" />
                  <span>
                    {t('language')}: {i18n.language.toUpperCase()}
                  </span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded"
                >
                  {theme === 'light' ? (
                    <MoonIcon className="h-5 w-5" />
                  ) : (
                    <SunIcon className="h-5 w-5" />
                  )}
                  <span>{theme === 'light' ? t('dark') : t('light')}</span>
                </button>
              </div>

              {/* Mobile links */}
              <a
                href="/equity-ui/ui/methodology"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t('link.methodology')}
              </a>
              <a
                href="/equity-ui/ui/privacy-faq"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t('link.privacy')}
              </a>
              <a
                href="#/analytics"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t('nav.analytics')}
              </a>
              <a
                href="#/compliance"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t('nav.compliance')}
              </a>
              <a
                href="#/settings"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {t('nav.settings')}
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
