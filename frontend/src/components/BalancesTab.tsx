import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BalancesList from './BalancesList';
import SettleUp from './SettleUp';
import type { ApiDebtTransfer, ApiUser } from '../types/api';

const DebtGraph = lazy(() => import('./DebtGraph/DebtGraph'));

type Member = ApiUser;

interface BalancesTabProps {
  groupId: string;
  members: Member[];
  balancesByCurrency: Record<string, Record<string, number>>;
  debtsByCurrency: Record<string, ApiDebtTransfer[]>;
  currentUserId: string;
  fallbackCurrency: string;
  onPaymentsChanged?: () => void | Promise<void>;
}

const BalancesTab: React.FC<BalancesTabProps> = ({
  groupId,
  members,
  balancesByCurrency,
  debtsByCurrency,
  currentUserId,
  fallbackCurrency,
  onPaymentsChanged,
}) => {
  const { t } = useTranslation();
  const currencies = useMemo(() => {
    const keys = new Set([
      ...Object.keys(balancesByCurrency),
      ...Object.keys(debtsByCurrency),
    ]);

    if (keys.size === 0) {
      keys.add(fallbackCurrency);
    }

    return Array.from(keys).sort((a, b) => {
      const edgeDiff = (debtsByCurrency[b]?.length ?? 0) - (debtsByCurrency[a]?.length ?? 0);
      return edgeDiff === 0 ? a.localeCompare(b) : edgeDiff;
    });
  }, [balancesByCurrency, debtsByCurrency, fallbackCurrency]);
  const [preferredCurrency, setPreferredCurrency] = useState<string | null>(null);
  const selectedCurrency = preferredCurrency && currencies.includes(preferredCurrency)
    ? preferredCurrency
    : currencies[0] ?? fallbackCurrency;

  const selectedDebts = debtsByCurrency[selectedCurrency] ?? [];
  const balancesByUser = balancesByCurrency[selectedCurrency] ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <BalancesList
          members={members}
          balancesByCurrency={balancesByCurrency}
          currentUserId={currentUserId}
          fallbackCurrency={fallbackCurrency}
        />

        <div className="space-y-4">
          {currencies.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {currencies.map((currency) => {
                const selected = selectedCurrency === currency;

                return (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => setPreferredCurrency(currency)}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary-fixed/60 ${
                      selected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    {currency}
                  </button>
                );
              })}
            </div>
          ) : null}

          <Suspense fallback={<div className="app-card p-5 text-sm text-on-surface-variant">{t('common.loading')}</div>}>
            <DebtGraph
              groupId={groupId}
              members={members}
              debts={selectedDebts}
              currency={selectedCurrency}
              currentUserId={currentUserId}
              balancesByUser={balancesByUser}
            />
          </Suspense>
        </div>
      </div>

      <section className="app-card-strong p-5 sm:p-6">
        <SettleUp
          groupId={groupId}
          debtsByCurrency={debtsByCurrency}
          members={members}
          onChanged={onPaymentsChanged}
        />
      </section>
    </div>
  );
};

export default BalancesTab;
