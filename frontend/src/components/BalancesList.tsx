import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../data/currencies';
import type { ApiDebtTransfer } from '../types/api';
import { getMemberSettlements } from '../utils/memberSettlements';
import { MemberAvatar } from './MemberIdentity';
import MemberProfileDialog from './MemberProfileDialog';

interface Member {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
  bio?: string | null;
}

interface BalancesListProps {
  members: Member[];
  balancesByCurrency: Record<string, Record<string, number>>;
  debtsByCurrency: Record<string, ApiDebtTransfer[]>;
  currentUserId: string;
  fallbackCurrency: string;
  visibleCurrencies?: string[];
}

const getAmountClassName = (amount: number) => {
  if (amount > 0.0001) return 'text-primary-fixed';
  if (amount < -0.0001) return 'text-error';
  return 'text-on-surface-variant';
};

const BalancesList: React.FC<BalancesListProps> = ({
  members,
  balancesByCurrency,
  debtsByCurrency,
  currentUserId,
  fallbackCurrency,
  visibleCurrencies,
}) => {
  const { t } = useTranslation();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const currencies = useMemo(() => {
    if (visibleCurrencies && visibleCurrencies.length > 0) {
      return visibleCurrencies;
    }

    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys.sort() : [fallbackCurrency];
  }, [balancesByCurrency, fallbackCurrency, visibleCurrencies]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.id === currentUserId) return -1;
      if (b.id === currentUserId) return 1;

      const aTotal = currencies.reduce((sum, currency) => sum + (balancesByCurrency[currency]?.[a.id] ?? 0), 0);
      const bTotal = currencies.reduce((sum, currency) => sum + (balancesByCurrency[currency]?.[b.id] ?? 0), 0);
      const aGroup = aTotal > 0.0001 ? 0 : aTotal < -0.0001 ? 1 : 2;
      const bGroup = bTotal > 0.0001 ? 0 : bTotal < -0.0001 ? 1 : 2;

      if (aGroup !== bGroup) return aGroup - bGroup;
      if (aGroup === 0) return bTotal - aTotal;
      if (aGroup === 1) return aTotal - bTotal;
      return a.name.localeCompare(b.name);
    });
  }, [balancesByCurrency, currencies, currentUserId, members]);

  return (
    <section className="app-card overflow-hidden">
      <div className="border-b border-outline-variant/20 p-5 sm:p-6">
        <p className="app-eyebrow">{t('balances.ledgerEyebrow')}</p>
        <h3 className="app-card-title mt-2">{t('balances.title')}</h3>
      </div>

      <div className="divide-y divide-white/10">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          const hasOpenBalance = currencies.some((currency) => Math.abs(balancesByCurrency[currency]?.[member.id] ?? 0) > 0.0001);

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMember(member)}
              className={`w-full min-w-0 p-4 text-left transition-colors sm:p-5 ${
                isCurrentUser
                  ? 'bg-primary/10'
                  : 'bg-surface-container-lowest/20'
              } hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-fixed/50`}
            >
              <div className="grid w-full min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,0.9fr)] xl:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <MemberAvatar member={member} size="lg" className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{isCurrentUser ? t('balances.youSuffix', { name: member.name }) : member.name}</p>
                    <p className="truncate text-xs text-on-surface-variant">{member.email}</p>
                  </div>
                  <span className={`app-status-chip ml-auto shrink-0 ${
                    hasOpenBalance
                      ? 'border-primary-fixed/25 bg-primary/12 text-primary-fixed'
                      : 'border-outline-variant/25 bg-surface-container text-on-surface-variant'
                  }`}>
                    {hasOpenBalance ? t('balances.open') : t('common.settled')}
                  </span>
                </div>

                <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
                  {currencies.map((currency) => {
                    const amount = balancesByCurrency[currency]?.[member.id] ?? 0;

                    return (
                      <div key={`${member.id}-${currency}`} className="rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{currency}</p>
                        <p className={`app-value mt-1 text-base ${getAmountClassName(amount)}`}>
                          {formatMoney(amount, currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedMember ? (
        <MemberProfileDialog
          member={selectedMember}
          isCurrentUser={selectedMember.id === currentUserId}
          balancesByCurrency={Object.fromEntries(
            currencies.map((currency) => [currency, balancesByCurrency[currency]?.[selectedMember.id] ?? 0])
          )}
          settlements={getMemberSettlements(selectedMember.id, debtsByCurrency, members, t('common.unknown'))}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </section>
  );
};

export default BalancesList;
