import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { AVATAR_BY_KEY } from '../../data/avatars';
import { formatMoney } from '../../data/currencies';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/apiError';
import RecordGroupPaymentDialog from './RecordGroupPaymentDialog';
import type { GroupPayment, PaymentMember } from './types';

interface PaymentsTabProps {
  groupId: string;
  members: PaymentMember[];
  fallbackCurrency: string;
  refreshKey: number;
  onChanged?: () => void | Promise<void>;
}

const PAGE_SIZE = 50;

const PaymentsTab: React.FC<PaymentsTabProps> = ({ groupId, members, fallbackCurrency, refreshKey, onChanged }) => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<GroupPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const firstMember = members[0]?.id ?? '';
  const secondMember = members.find((member) => member.id !== firstMember)?.id ?? '';

  const fetchPayments = useCallback(async (nextSkip = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await api.get<GroupPayment[]>(`/groups/${groupId}/payments`, {
        params: { skip: nextSkip, take: PAGE_SIZE }
      });
      setPayments((current) => (append ? [...current, ...response.data] : response.data));
      setSkip(nextSkip + response.data.length);
      setHasMore(response.data.length === PAGE_SIZE);
    } catch (err) {
      setError(getApiErrorMessage(err, t));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [groupId, t]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments, refreshKey]);

  const handleChanged = useCallback(async () => {
    await fetchPayments(0, false);
    await onChanged?.();
  }, [fetchPayments, onChanged]);

  const handleVoid = async (payment: GroupPayment) => {
    if (!window.confirm(t('payments.voidConfirm'))) return;

    setError('');
    try {
      await api.post(`/payments/${payment.id}/void`);
      await handleChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, t, 'payments.voidFailed'));
    }
  };

  const renderAvatar = (member: PaymentMember | undefined) => {
    const avatar = member?.avatarKey ? AVATAR_BY_KEY[member.avatarKey] : null;

    return (
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${avatar?.bg ?? 'bg-surface-container text-on-surface'}`}>
        {avatar ? <span aria-hidden="true">{avatar.emoji}</span> : member?.name.charAt(0).toUpperCase() ?? '?'}
      </span>
    );
  };

  const activePayments = payments.filter((payment) => payment.status !== 'Voided');
  const voidedPayments = payments.filter((payment) => payment.status === 'Voided');

  const renderPayment = (payment: GroupPayment) => {
    const from = membersById.get(payment.fromUserId);
    const to = membersById.get(payment.toUserId);
    const recordedBy = membersById.get(payment.recordedByUserId);
    const voided = payment.status === 'Voided';

    return (
      <article key={payment.id} className={`app-card p-4 sm:p-5 ${voided ? 'opacity-70' : ''}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center">
              {renderAvatar(from)}
              <span className="material-symbols-outlined mx-2 text-base text-on-surface-variant">arrow_forward</span>
              {renderAvatar(to)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-headline text-lg font-bold text-on-surface">
                {t('payments.pays', { from: from?.name ?? t('common.unknown'), to: to?.name ?? t('common.unknown') })}
              </p>
              <p className="text-sm font-semibold text-on-surface-variant">
                {t('payments.recordedBy', {
                  name: recordedBy?.name ?? t('common.unknown'),
                  date: formatDateTime(payment.recordedAt),
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <p className={`font-headline text-xl font-bold ${voided ? 'text-on-surface-variant line-through' : 'text-primary-fixed'}`}>
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <span className="w-fit rounded-lg bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {voided ? t('payments.voided') : t('payments.recorded')}
            </span>
          </div>
        </div>

        {payment.note ? <p className="mt-3 text-sm text-on-surface-variant">{payment.note}</p> : null}

        {!voided ? (
          <div className="mt-5 flex justify-end">
            <button type="button" className="app-button-secondary py-2 text-error" onClick={() => handleVoid(payment)}>
              <span className="material-symbols-outlined">undo</span>
              {t('payments.void')}
            </button>
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <section className="app-card-strong p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-secondary">{t('payments.historyEyebrow')}</p>
            <h3 className="mt-2 font-headline text-2xl font-bold text-on-surface">{t('payments.historyTitle')}</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant">{t('payments.historySummary')}</p>
          </div>
          <button type="button" className="app-button-primary" onClick={() => setManualOpen(true)} disabled={members.length < 2}>
            <span className="material-symbols-outlined">payments</span>
            {t('payments.recordManual')}
          </button>
        </div>
      </section>

      {error ? <div className="rounded-xl bg-error/10 p-4 text-sm font-semibold text-error">{error}</div> : null}
      {loading ? <div className="py-10 text-center text-on-surface-variant">{t('common.loading')}</div> : null}

      {!loading ? (
        <section className="space-y-3">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('payments.recordedPayments')}</h3>
          {activePayments.length === 0 ? (
            <div className="app-card p-5 text-sm text-on-surface-variant">{t('payments.empty')}</div>
          ) : (
            activePayments.map(renderPayment)
          )}
        </section>
      ) : null}

      {!loading && voidedPayments.length > 0 ? (
        <section className="space-y-3">
          <h3 className="font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">{t('payments.voidedPayments')}</h3>
          {voidedPayments.map(renderPayment)}
        </section>
      ) : null}

      {!loading && hasMore ? (
        <div className="flex justify-center">
          <button type="button" className="app-button-secondary" onClick={() => fetchPayments(skip, true)} disabled={loadingMore}>
            <span className="material-symbols-outlined">expand_more</span>
            {loadingMore ? t('common.loading') : t('activity.loadMore')}
          </button>
        </div>
      ) : null}

      {manualOpen ? (
        <RecordGroupPaymentDialog
          groupId={groupId}
          members={members}
          initialFromUserId={firstMember}
          initialToUserId={secondMember}
          initialAmount={0}
          initialCurrency={fallbackCurrency}
          onClose={() => setManualOpen(false)}
          onRecorded={handleChanged}
        />
      ) : null}
    </div>
  );
};

export default PaymentsTab;
