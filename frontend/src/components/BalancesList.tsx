import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney } from '../data/currencies';
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
  currentUserId: string;
  fallbackCurrency: string;
}

const getAmountClassName = (amount: number) => {
  if (amount > 0.0001) return 'text-primary-fixed';
  if (amount < -0.0001) return 'text-error';
  return 'text-on-surface-variant';
};

const BalancesList: React.FC<BalancesListProps> = ({
  members,
  balancesByCurrency,
  currentUserId,
  fallbackCurrency,
}) => {
  const { t } = useTranslation();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const currencies = useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys.sort() : [fallbackCurrency];
  }, [balancesByCurrency, fallbackCurrency]);

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
    <section className="app-card-strong overflow-hidden">
      <div className="border-b border-outline-variant/20 p-5 sm:p-6">
        <h3 className="font-headline text-xl font-bold text-on-surface">{t('balances.title')}</h3>
      </div>

      <div className="space-y-2 p-3 sm:p-4">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMember(member)}
              className={`w-full min-w-0 rounded-xl border p-4 transition-colors ${
                isCurrentUser
                  ? 'border-primary-fixed/25 bg-primary/12'
                  : 'border-white/10 bg-surface-container-lowest'
              } text-left hover:border-primary-fixed/40 hover:bg-surface-container-low`}
            >
              <div className="grid w-full min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,0.9fr)] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <MemberAvatar member={member} size="lg" className="h-11 w-11" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-on-surface">{isCurrentUser ? t('balances.youSuffix', { name: member.name }) : member.name}</p>
                    <p className="truncate text-xs text-on-surface-variant">{member.email}</p>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-2">
                  {currencies.map((currency) => {
                    const amount = balancesByCurrency[currency]?.[member.id] ?? 0;

                    return (
                      <div key={`${member.id}-${currency}`} className="rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{currency}</p>
                        <p className={`font-headline text-lg font-bold ${getAmountClassName(amount)}`}>
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
          onClose={() => setSelectedMember(null)}
        />
      ) : null}
    </section>
  );
};

export default BalancesList;
