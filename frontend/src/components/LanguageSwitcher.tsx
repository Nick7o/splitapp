import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLang } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation();

  return (
    <div
      className={`grid grid-cols-2 rounded-xl border border-white/10 bg-surface-container p-1 ${className}`}
      role="group"
      aria-label={t('language.title')}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const selected = i18n.resolvedLanguage === language || i18n.language === language;

        return (
          <button
            key={language}
            type="button"
            onClick={() => {
              void i18n.changeLanguage(language as SupportedLang);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-fixed/50 ${
              selected
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-white/10 hover:text-on-surface'
            }`}
            aria-pressed={selected}
          >
            {t(`language.${language}`)}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
