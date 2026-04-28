import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AVATAR_BY_KEY } from '../data/avatars';
import { formatMoney } from '../data/currencies';
import type { ApiDebtTransfer, ApiUser } from '../types/api';
import RecordGroupPaymentDialog from './Payments/RecordGroupPaymentDialog';

interface DebtTransfer extends ApiDebtTransfer {
  fromName: string;
  toName: string;
  fromAvatarKey?: string | null;
  toAvatarKey?: string | null;
}

interface SelectedPayment {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
}

interface SettleUpProps {
  groupId: string;
  debtsByCurrency: Record<string, ApiDebtTransfer[]>;
  members: ApiUser[];
  onChanged?: () => void | Promise<void>;
}

const avatarClassName = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container text-sm font-bold text-on-surface sm:h-11 sm:w-11 sm:text-base';

const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || '?';
};

const SettleUp: React.FC<SettleUpProps> = ({ groupId, debtsByCurrency, members, onChanged }) => {
  const { t } = useTranslation();
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null);

  const membersById = useMemo(() => {
    return new Map(members.map((member) => [member.id, member]));
  }, [members]);

  const transferSections = useMemo(() => {
    return Object.entries(debtsByCurrency)
      .map(([currency, debts]) => ({
        currency,
        transfers: debts.map((debt) => {
          const fromUser = membersById.get(debt.fromUserId);
          const toUser = membersById.get(debt.toUserId);

          return {
            ...debt,
            fromName: fromUser?.name ?? t('common.unknown'),
            toName: toUser?.name ?? t('common.unknown'),
            fromAvatarKey: fromUser?.avatarKey,
            toAvatarKey: toUser?.avatarKey,
          };
        }),
      }))
      .filter((section) => section.transfers.length > 0);
  }, [debtsByCurrency, membersById, t]);

  const allTransfers = transferSections.flatMap((section) => section.transfers);
  const totalsByCurrency = transferSections.map((section) => ({
    currency: section.currency,
    total: section.transfers.reduce((sum, transfer) => sum + transfer.amount, 0),
  }));

  const handleRecorded = async () => {
    await onChanged?.();
  };

  const renderAvatar = (name: string, avatarKey?: string | null) => {
    const avatar = avatarKey ? AVATAR_BY_KEY[avatarKey] : null;

    return (
      <span className={`${avatarClassName} ${avatar?.bg ?? ''}`}>
        {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : getInitials(name)}
      </span>
    );
  };

  const renderTransfer = (transfer: DebtTransfer, currency: string, index: number) => (
    <div
      key={`${currency}-${transfer.fromUserId}-${transfer.toUserId}-${index}`}
      className="rounded-xl border border-white/10 bg-surface-container-lowest p-3 transition hover:-translate-y-0.5 hover:bg-surface-container-low sm:p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center">
            {renderAvatar(transfer.fromName, transfer.fromAvatarKey)}
            <span className="material-symbols-outlined mx-1.5 text-base text-on-surface-variant sm:mx-2">arrow_forward</span>
            {renderAvatar(transfer.toName, transfer.toAvatarKey)}
          </div>

          <div className="min-w-0">
            <p className="break-words font-headline text-base font-bold leading-tight text-on-surface sm:text-lg">
              {t('payments.pays', { from: transfer.fromName, to: transfer.toName })}
            </p>
            <p className="mt-0.5 text-sm font-bold text-primary-fixed">
              {formatMoney(transfer.amount, currency)}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="app-button-primary w-full py-2 md:w-auto"
          onClick={() => setSelectedPayment({
            fromUserId: transfer.fromUserId,
            toUserId: transfer.toUserId,
            amount: transfer.amount,
            currency,
          })}
        >
          <span className="material-symbols-outlined">payments</span>
          {t('payments.record')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t('payments.suggestedEyebrow')}</p>
          <h2 className="mt-2 font-headline text-2xl font-bold text-on-surface">{t('payments.suggestedTitle')}</h2>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant">
            {t('payments.suggestedSummary', { count: allTransfers.length })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {totalsByCurrency.length === 0 ? (
            <span className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-sm font-bold text-on-surface-variant">
              {t('common.settled')}
            </span>
          ) : (
            totalsByCurrency.map((section) => (
              <span key={section.currency} className="rounded-lg border border-primary-fixed/25 bg-primary/12 px-3 py-1.5 text-sm font-bold text-primary-fixed">
                {formatMoney(section.total, section.currency)}
              </span>
            ))
          )}
        </div>
      </div>

      {allTransfers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-6 text-center text-sm font-medium text-on-surface-variant">
          {t('payments.allSettled')}
        </div>
      ) : (
        <div className="space-y-5">
          {transferSections.map((section) => (
            <section key={section.currency} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  {t('payments.inCurrency', { currency: section.currency })}
                </h3>
                <span className="text-xs font-bold text-on-surface-variant">
                  {section.transfers.length === 1
                    ? t('payments.transferCountOne')
                    : t('payments.transferCount', { count: section.transfers.length })}
                </span>
              </div>
              <div className="space-y-3">
                {section.transfers.map((transfer, index) => renderTransfer(transfer, section.currency, index))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedPayment ? (
        <RecordGroupPaymentDialog
          groupId={groupId}
          members={members}
          initialFromUserId={selectedPayment.fromUserId}
          initialToUserId={selectedPayment.toUserId}
          initialAmount={selectedPayment.amount}
          initialCurrency={selectedPayment.currency}
          maxAmount={selectedPayment.amount}
          onClose={() => setSelectedPayment(null)}
          onRecorded={handleRecorded}
        />
      ) : null}
    </div>
  );
};

export default SettleUp;
