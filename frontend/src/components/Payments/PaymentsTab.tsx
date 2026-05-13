import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { ConfirmationDialog } from '../Dialog';
import { MemberAvatarButton, MemberNameButton } from '../MemberIdentity';
import MemberProfileDialog, { type MemberProfile } from '../MemberProfileDialog';
import { useToast } from '../../context/toast';
import { formatMoney } from '../../data/currencies';
import { formatDateTime } from '../../utils/date';
import { getApiErrorMessage } from '../../utils/apiError';
import { getStoredUser } from '../../utils/storage';
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
  const { showToast } = useToast();
  const [payments, setPayments] = useState<GroupPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [paymentToVoid, setPaymentToVoid] = useState<GroupPayment | null>(null);
  const [voidingPayment, setVoidingPayment] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const currentUserId = useMemo(() => getStoredUser().id ?? '', []);
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
      const message = getApiErrorMessage(err, t);
      setError(message);
      showToast(message, { variant: 'error' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [groupId, showToast, t]);

  useEffect(() => {
    void fetchPayments();
  }, [fetchPayments, refreshKey]);

  const handleChanged = useCallback(async () => {
    await fetchPayments(0, false);
    await onChanged?.();
  }, [fetchPayments, onChanged]);

  const handleVoid = (payment: GroupPayment) => {
    setPaymentToVoid(payment);
  };

  const confirmVoidPayment = async () => {
    if (!paymentToVoid) return;

    setError('');
    setVoidingPayment(true);
    try {
      await api.post(`/payments/${paymentToVoid.id}/void`);
      await handleChanged();
      setPaymentToVoid(null);
    } catch (err) {
      const message = getApiErrorMessage(err, t, 'payments.voidFailed');
      setError(message);
      showToast(message, { variant: 'error' });
      setPaymentToVoid(null);
    } finally {
      setVoidingPayment(false);
    }
  };

  const activePayments = payments.filter((payment) => payment.status !== 'Voided');
  const voidedPayments = payments.filter((payment) => payment.status === 'Voided');
  const totalsByCurrency = activePayments.reduce<Record<string, number>>((totals, payment) => {
    totals[payment.currency] = (totals[payment.currency] ?? 0) + payment.amount;
    return totals;
  }, {});
  const paymentToVoidFrom = paymentToVoid ? membersById.get(paymentToVoid.fromUserId) : undefined;
  const paymentToVoidTo = paymentToVoid ? membersById.get(paymentToVoid.toUserId) : undefined;

  const renderPayment = (payment: GroupPayment) => {
    const from = membersById.get(payment.fromUserId);
    const to = membersById.get(payment.toUserId);
    const recordedBy = membersById.get(payment.recordedByUserId);
    const voided = payment.status === 'Voided';

    return (
      <article key={payment.id} className={`rounded-xl border border-white/10 bg-surface-container-lowest p-4 ${voided ? 'opacity-70' : ''}`}>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(9rem,auto)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center">
              <MemberAvatarButton member={from} onOpen={setSelectedMember} />
              <span className="material-symbols-outlined mx-2 text-base text-on-surface-variant">arrow_forward</span>
              <MemberAvatarButton member={to} onOpen={setSelectedMember} />
            </div>
            <div className="min-w-0">
              <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 font-headline text-base font-bold text-on-surface sm:text-lg">
                <MemberNameButton member={from} fallback={t('common.unknown')} onOpen={setSelectedMember} />
                <span className="material-symbols-outlined text-base text-on-surface-variant" aria-hidden="true">arrow_forward</span>
                <MemberNameButton member={to} fallback={t('common.unknown')} onOpen={setSelectedMember} />
              </p>
              <p className="text-sm font-semibold text-on-surface-variant">
                {t('payments.recordedByPrefix')}{' '}
                <MemberNameButton
                  member={recordedBy}
                  fallback={t('common.unknown')}
                  onOpen={setSelectedMember}
                  className="text-on-surface-variant hover:text-primary-fixed"
                />
                {`: ${formatDateTime(payment.recordedAt)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:block md:text-right">
            <p className={`app-value text-lg ${voided ? 'text-on-surface-variant line-through' : 'text-primary-fixed'}`}>
              {formatMoney(payment.amount, payment.currency)}
            </p>
            <span className={`app-status-chip mt-0 md:mt-2 ${
              voided
                ? 'border-outline-variant/25 bg-surface-container text-on-surface-variant'
                : 'border-primary-fixed/25 bg-primary/12 text-primary-fixed'
            }`}>
              {voided ? t('payments.voided') : t('payments.recorded')}
            </span>
          </div>

          <div className="flex justify-end">
            {!voided ? (
              <button
                type="button"
                className="app-icon-button text-error hover:bg-error/10 hover:text-error"
                onClick={() => handleVoid(payment)}
                aria-label={t('payments.void')}
                title={t('payments.void')}
              >
                <span className="material-symbols-outlined text-base">undo</span>
              </button>
            ) : null}
          </div>
        </div>

        {payment.note ? <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-on-surface-variant">{payment.note}</p> : null}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <section className="app-card-strong p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-eyebrow text-secondary">{t('payments.historyEyebrow')}</p>
            <h3 className="app-section-title mt-2">{t('payments.historyTitle')}</h3>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-on-surface-variant">{t('payments.historySummary')}</p>
          </div>
          <button type="button" className="app-button-primary" onClick={() => setManualOpen(true)} disabled={members.length < 2}>
            <span className="material-symbols-outlined">payments</span>
            {t('payments.recordManual')}
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-3">
            <p className="app-eyebrow">{t('payments.recordedPayments')}</p>
            <p className="app-value mt-3 text-3xl">{activePayments.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-surface-container-lowest p-3 sm:col-span-2">
            <p className="app-eyebrow">{t('payments.recordedTotal')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(totalsByCurrency).length > 0 ? (
                Object.entries(totalsByCurrency).map(([currency, amount]) => (
                  <span key={currency} className="app-data-pill border-primary-fixed/25 bg-primary/12 text-primary-fixed">
                    {formatMoney(amount, currency)}
                  </span>
                ))
              ) : (
                <span className="text-sm font-semibold text-on-surface-variant">{t('payments.noRecordedTotal')}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl bg-error/10 p-4 text-sm font-semibold text-error">{error}</div> : null}
      {loading ? <div className="py-10 text-center text-on-surface-variant">{t('common.loading')}</div> : null}

      {!loading ? (
        <section className="space-y-3">
          <h3 className="app-eyebrow">{t('payments.recordedPayments')}</h3>
          {activePayments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">payments</span>
              <p className="mt-3 font-headline text-xl font-bold text-on-surface">{t('payments.emptyTitle')}</p>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-on-surface-variant">{t('payments.empty')}</p>
            </div>
          ) : (
            activePayments.map(renderPayment)
          )}
        </section>
      ) : null}

      {!loading && voidedPayments.length > 0 ? (
        <section className="space-y-3">
          <h3 className="app-eyebrow">{t('payments.voidedPayments')}</h3>
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

      {selectedMember ? (
        <MemberProfileDialog
          member={selectedMember}
          isCurrentUser={selectedMember.id === currentUserId}
          onClose={() => setSelectedMember(null)}
        />
      ) : null}

      <ConfirmationDialog
        open={Boolean(paymentToVoid)}
        title={t('payments.voidTitle')}
        message={paymentToVoid ? t('payments.voidBody', {
          amount: formatMoney(paymentToVoid.amount, paymentToVoid.currency),
          from: paymentToVoidFrom?.name ?? t('common.unknown'),
          to: paymentToVoidTo?.name ?? t('common.unknown'),
        }) : ''}
        confirmLabel={t('payments.void')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        busy={voidingPayment}
        onClose={() => setPaymentToVoid(null)}
        onConfirm={confirmVoidPayment}
      />
    </div>
  );
};

export default PaymentsTab;
