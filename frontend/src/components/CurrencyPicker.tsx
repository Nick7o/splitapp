import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CURRENCIES } from '../data/currencies';

interface CurrencyPickerProps {
  value: string;
  onChange: (code: string) => void;
  recent?: string[];
  label?: string;
  disabled?: boolean;
}

const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
  value,
  onChange,
  recent = [],
  label,
  disabled = false
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const recentList = useMemo(
    () => recent
      .map((code) => CURRENCIES.find((currency) => currency.code === code))
      .filter((currency): currency is (typeof CURRENCIES)[number] => Boolean(currency)),
    [recent]
  );

  const filteredCurrencies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return CURRENCIES;
    }

    return CURRENCIES.filter((currency) =>
      currency.code.toLowerCase().includes(normalizedQuery) ||
      currency.name.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value);

  const closePicker = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (code: string) => {
    onChange(code);
    closePicker();
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-on-surface-variant mb-1">{label || t('currencyPicker.currency')}</label>
      <button
        type="button"
        className="app-input flex items-center justify-between"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closePicker();
          }
        }}
      >
        <span className="font-medium">
          {selectedCurrency ? `${selectedCurrency.code} - ${selectedCurrency.name}` : value}
        </span>
        <span className="material-symbols-outlined text-on-surface-variant">unfold_more</span>
      </button>

      {open && (
        <div className="app-card motion-pop absolute left-0 right-0 z-50 mt-2 border-outline-variant/25 bg-surface-container-high p-3 shadow-[0_20px_48px_rgba(2,6,23,0.45)] ring-1 ring-white/10">
          <input
            ref={searchInputRef}
            type="text"
            className="app-input"
            placeholder={t('currencyPicker.searchPlaceholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closePicker();
              }
            }}
          />

          {recentList.length > 0 && !query && (
            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-normal text-on-surface-variant mb-2">{t('currencyPicker.recent')}</p>
              <div className="flex flex-wrap gap-2">
                {recentList.map((currency) => (
                  <button
                    key={`recent-${currency.code}`}
                    type="button"
                    className="rounded-lg border border-white/10 bg-surface-container px-2 py-1 text-xs font-semibold text-on-surface"
                    onClick={() => handleSelect(currency.code)}
                  >
                    {currency.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 max-h-64 overflow-y-auto no-scrollbar">
            {filteredCurrencies.map((currency) => (
              <button
                key={currency.code}
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-container ${
                  currency.code === value ? 'bg-surface-container-high text-secondary' : 'text-on-surface'
                }`}
                onClick={() => handleSelect(currency.code)}
              >
                <span className="font-medium">{currency.code} - {currency.name}</span>
                <span className="text-on-surface-variant">{currency.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyPicker;
