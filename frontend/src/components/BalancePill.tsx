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
  sm: 'h-6 px-2 text-[11px]',
  md: 'h-7 px-2.5 text-xs',
  lg: 'h-8 px-3 text-sm'
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
      ? 'bg-white/12 text-on-primary border-white/25'
      : isPositive
        ? 'bg-primary-fixed/18 text-on-primary border-primary-fixed/40'
        : 'bg-error/22 text-on-primary border-error/40'
    : isNeutral
      ? 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
      : isPositive
        ? 'bg-primary/12 text-primary-fixed border-primary-fixed/28'
        : 'bg-error-container text-error border-error/30';

  const content = explicitLabel
    ? label
    : typeof amount === 'number'
      ? formatMoney(amount, currency)
      : t('common.settled');

  return (
    <span
      className={`inline-flex items-center rounded-md border font-label font-bold leading-none tabular-nums ${SIZE_CLASSES[size]} ${paletteClass}`}
    >
      {content}
    </span>
  );
};

export default BalancePill;
