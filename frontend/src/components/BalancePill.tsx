import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../data/currencies';

type BalancePillSize = 'sm' | 'md' | 'lg';

interface BalancePillProps {
  amount?: number;
  currency?: string;
  label?: string;
  size?: BalancePillSize;
  onDark?: boolean;
}

const SIZE_CLASSES: Record<BalancePillSize, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-3.5 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

const BalancePill: React.FC<BalancePillProps> = ({
  amount,
  currency = 'PLN',
  label,
  size = 'md',
  onDark = false
}) => {
  const { t } = useTranslation();
  const explicitLabel = typeof label === 'string' && label.length > 0;
  const isNeutral = explicitLabel || typeof amount !== 'number' || Math.abs(amount) < 0.0001;
  const isPositive = !isNeutral && (amount as number) > 0;

  const paletteClass = onDark
    ? isNeutral
      ? 'bg-white/14 text-on-primary border-white/30 shadow-[0_6px_20px_rgba(2,6,23,0.2)]'
      : isPositive
        ? 'bg-primary-fixed/22 text-on-primary border-primary-fixed/45 shadow-[0_6px_20px_rgba(2,6,23,0.2)]'
        : 'bg-error/28 text-on-primary border-error/45 shadow-[0_6px_20px_rgba(2,6,23,0.2)]'
    : isNeutral
      ? 'bg-surface-container text-on-surface-variant border-outline-variant/40'
      : isPositive
        ? 'bg-primary/14 text-primary-fixed border-primary-fixed/30'
        : 'bg-error-container text-error border-error/30';

  const content = explicitLabel
    ? label
    : typeof amount === 'number'
      ? formatMoney(amount, currency)
      : t('common.settled');

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-label font-semibold tracking-wide ${SIZE_CLASSES[size]} ${paletteClass}`}
    >
      {content}
    </span>
  );
};

export default BalancePill;
