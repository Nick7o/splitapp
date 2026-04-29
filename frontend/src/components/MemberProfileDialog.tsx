import React from 'react';
import { useTranslation } from 'react-i18next';
import { AVATAR_BY_KEY } from '../data/avatars';
import { formatMoney } from '../data/currencies';

export interface MemberProfile {
  id: string;
  name: string;
  email?: string;
  avatarKey?: string | null;
  bio?: string | null;
  roleLabel?: string;
}

interface MemberProfileDialogProps {
  member: MemberProfile;
  isCurrentUser?: boolean;
  balancesByCurrency?: Record<string, number>;
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
  onClose,
}) => {
  const { t } = useTranslation();
  const avatar = member.avatarKey ? AVATAR_BY_KEY[member.avatarKey] : null;
  const balanceEntries = Object.entries(balancesByCurrency ?? {}).filter(([, amount]) => Math.abs(amount) > 0.0001);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 px-3 pb-3 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="app-card-strong w-full max-w-md p-5 shadow-[0_24px_70px_rgba(0,0,0,0.4)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`app-avatar flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold ${avatar?.bg ?? 'bg-primary text-on-primary'}`}>
              {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : member.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-headline text-2xl font-bold text-on-surface">
                {isCurrentUser ? t('memberProfile.youTitle', { name: member.name }) : member.name}
              </h2>
              {member.email ? (
                <p className="mt-1 truncate text-sm font-medium text-on-surface-variant">{maskEmail(member.email)}</p>
              ) : null}
              {member.roleLabel ? (
                <span className="mt-2 inline-flex rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('memberProfile.bio')}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-on-surface">
              {member.bio?.trim() || t('memberProfile.noBio')}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('memberProfile.groupBalance')}</p>
            {balanceEntries.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {balanceEntries.map(([currency, amount]) => (
                  <div key={currency} className="rounded-lg border border-white/10 bg-surface-container px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{currency}</p>
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
        </div>
      </section>
    </div>
  );
};

export default MemberProfileDialog;
