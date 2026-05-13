import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { AVATAR_BY_KEY } from '../data/avatars';
import { formatMoney } from '../data/currencies';
import { DialogShell } from './Dialog';

export interface MemberProfile {
  id: string;
  name: string;
  email?: string;
  avatarKey?: string | null;
  bio?: string | null;
  roleLabel?: string;
}

export interface MemberSettlement {
  currency: string;
  direction: 'pays' | 'gets';
  otherName: string;
  amount: number;
}

interface MemberProfileDialogProps {
  member: MemberProfile;
  isCurrentUser?: boolean;
  balancesByCurrency?: Record<string, number>;
  settlements?: MemberSettlement[];
  onClose: () => void;
}

const maskEmail = (value: string): string => {
  if (!value) return '';

  const [localPart, domain] = value.split('@');
  if (!localPart || !domain) return value;

  const visibleLocal = localPart.length <= 2 ? localPart : `${localPart.slice(0, 2)}...`;
  const [domainName, ...domainRest] = domain.split('.');
  const visibleDomain = domainName.length <= 3 ? domainName : `${domainName.slice(0, 3)}...`;

  return `${visibleLocal}@${visibleDomain}${domainRest.length > 0 ? `.${domainRest[domainRest.length - 1]}` : ''}`;
};

const getAmountClassName = (amount: number) => {
  if (amount > 0.0001) return 'text-primary-fixed';
  if (amount < -0.0001) return 'text-error';
  return 'text-on-surface-variant';
};

const MemberProfileDialog: React.FC<MemberProfileDialogProps> = ({
  member,
  isCurrentUser = false,
  balancesByCurrency,
  settlements,
  onClose,
}) => {
  const { t } = useTranslation();
  const titleId = useId();
  const avatar = member.avatarKey ? AVATAR_BY_KEY[member.avatarKey] : null;
  const balanceEntries = Object.entries(balancesByCurrency ?? {}).filter(([, amount]) => Math.abs(amount) > 0.0001);
  const hasBalanceContext = Boolean(balancesByCurrency);
  const hasSettlementContext = Boolean(settlements);

  return (
    <DialogShell
      titleId={titleId}
      onClose={onClose}
      panelClassName="flex max-w-md flex-col p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className={`app-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold ${avatar?.bg ?? 'bg-primary text-on-primary'}`}>
            {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : member.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-headline text-2xl font-bold text-on-surface">
              {isCurrentUser ? t('memberProfile.youTitle', { name: member.name }) : member.name}
            </h2>
            {member.email ? (
              <p className="mt-1 truncate text-sm font-medium text-on-surface-variant">{maskEmail(member.email)}</p>
            ) : null}
            {member.roleLabel ? (
              <span className="mt-2 inline-flex rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">
                {member.roleLabel}
              </span>
            ) : null}
          </div>
        </div>

        <button type="button" className="app-icon-button" onClick={onClose} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
          <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('memberProfile.bio')}</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface">
            {member.bio?.trim() || t('memberProfile.noBio')}
          </p>
        </div>

        {hasBalanceContext ? (
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('memberProfile.netBalance')}</p>
            {balanceEntries.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {balanceEntries.map(([currency, amount]) => (
                  <div key={currency} className="rounded-lg border border-white/10 bg-surface-container px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{currency}</p>
                    <p className={`mt-1 font-headline text-lg font-bold ${getAmountClassName(amount)}`}>
                      {formatMoney(amount, currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-on-surface-variant">{t('common.settled')}</p>
            )}
          </div>
        ) : null}

        {hasSettlementContext ? (
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{t('memberProfile.suggestedSettlements')}</p>
            {settlements && settlements.length > 0 ? (
              <div className="mt-3 space-y-2">
                {settlements.map((settlement, index) => (
                  <div key={`${settlement.currency}-${settlement.otherName}-${settlement.direction}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-surface-container px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {settlement.direction === 'pays'
                          ? t('memberProfile.pays', { name: settlement.otherName })
                          : t('memberProfile.getsFrom', { name: settlement.otherName })}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-normal text-on-surface-variant">{settlement.currency}</p>
                    </div>
                    <p className={`shrink-0 font-headline text-lg font-bold ${settlement.direction === 'pays' ? 'text-error' : 'text-primary-fixed'}`}>
                      {formatMoney(settlement.amount, settlement.currency)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm font-semibold text-on-surface-variant">{t('memberProfile.noOpenSettlements')}</p>
            )}
          </div>
        ) : null}
      </div>
    </DialogShell>
  );
};

export default MemberProfileDialog;
