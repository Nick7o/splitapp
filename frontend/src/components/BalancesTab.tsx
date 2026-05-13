import React, { Suspense, lazy, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BalancesList from './BalancesList';
import SettleUp from './SettleUp';
import { formatMoney } from '../data/currencies';
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
  const openAmount = selectedDebts.reduce((sum, debt) => sum + debt.amount, 0);
  const settledMembers = members.filter((member) => Math.abs(balancesByUser[member.id] ?? 0) <= 0.0001).length;

  return (
    <div className="space-y-6">
      <section className="app-card-strong p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="app-eyebrow">{t('balances.workspaceEyebrow')}</p>
            <h2 className="app-section-title mt-2">{t('balances.workspaceTitle')}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant">
              {t('balances.workspaceBody')}
            </p>
          </div>

          {currencies.length > 1 ? (
            <div className="app-segmented">
              {currencies.map((currency) => {
                const selected = selectedCurrency === currency;

                return (
                  <button
                    key={currency}
                    type="button"
                    onClick={() => setPreferredCurrency(currency)}
                    className={`app-segmented-item ${
                      selected
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                    }`}
                  >
                    {currency}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="app-eyebrow">{t('balances.openTransfers')}</p>
            <p className="app-value mt-3 text-3xl text-primary-fixed">{selectedDebts.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="app-eyebrow">{t('balances.openAmount')}</p>
            <p className="app-value mt-3 text-2xl">{formatMoney(openAmount, selectedCurrency)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="app-eyebrow">{t('balances.settledMembers')}</p>
            <p className="app-value mt-3 text-2xl">{settledMembers}/{members.length}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1.18fr)]">
        <BalancesList
          members={members}
          balancesByCurrency={balancesByCurrency}
          debtsByCurrency={debtsByCurrency}
          currentUserId={currentUserId}
          fallbackCurrency={fallbackCurrency}
          visibleCurrencies={[selectedCurrency]}
        />

        <div className="space-y-4">
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

          <section className="app-card p-5 sm:p-6">
            <SettleUp
              groupId={groupId}
              debtsByCurrency={{ [selectedCurrency]: selectedDebts }}
              members={members}
              onChanged={onPaymentsChanged}
              compact
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default BalancesTab;
