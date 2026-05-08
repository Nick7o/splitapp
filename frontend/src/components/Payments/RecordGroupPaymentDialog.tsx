import React, { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { useToast } from '../../context/toast';
import { formatMoney } from '../../data/currencies';
import { getApiErrorMessage } from '../../utils/apiError';
import CurrencyPicker from '../CurrencyPicker';
import { DialogShell } from '../Dialog';
import type { PaymentMember } from './types';

interface RecordGroupPaymentDialogProps {
  groupId: string;
  members: PaymentMember[];
  initialFromUserId: string;
  initialToUserId: string;
  initialAmount: number;
  initialCurrency: string;
  maxAmount?: number;
  onClose: () => void;
  onRecorded: () => void | Promise<void>;
}

const RecordGroupPaymentDialog: React.FC<RecordGroupPaymentDialogProps> = ({
  groupId,
  members,
  initialFromUserId,
  initialToUserId,
  initialAmount,
  initialCurrency,
  maxAmount,
  onClose,
  onRecorded,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const titleId = useId();
  const descriptionId = useId();
  const [fromUserId, setFromUserId] = useState(initialFromUserId);
  const [toUserId, setToUserId] = useState(initialToUserId);
  const [amount, setAmount] = useState(String(initialAmount));
  const [currency, setCurrency] = useState(initialCurrency);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const parsedAmount = Number(amount);
  const selectedFromUserId = fromUserId || members[0]?.id || '';
  const selectedToUserId = toUserId && toUserId !== selectedFromUserId
    ? toUserId
    : members.find((member) => member.id !== selectedFromUserId)?.id || '';
  const invalidAmount = parsedAmount <= 0 || (maxAmount !== undefined && parsedAmount > maxAmount);
  const validationError = invalidAmount
    ? t('payments.invalidAmount')
    : selectedFromUserId === selectedToUserId
      ? t('apiErrors.payment.self')
      : '';
  const payer = useMemo(() => members.find((member) => member.id === selectedFromUserId), [members, selectedFromUserId]);
  const payee = useMemo(() => members.find((member) => member.id === selectedToUserId), [members, selectedToUserId]);

  const handleRecord = async () => {
    if (validationError || !selectedFromUserId || !selectedToUserId) {
      setError(validationError || t('payments.invalidAmount'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.post(`/groups/${groupId}/payments`, {
        fromUserId: selectedFromUserId,
        toUserId: selectedToUserId,
        amount: parsedAmount,
        currency,
        note: note.trim() || null,
      });
      await onRecorded();
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err, t, 'payments.recordFailed');
      setError(message);
      showToast(message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      titleId={titleId}
      descriptionId={descriptionId}
      onClose={saving ? () => undefined : onClose}
      panelClassName="max-w-lg p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id={titleId} className="font-headline text-2xl font-bold text-on-surface">{t('payments.recordTitle')}</h3>
          <p id={descriptionId} className="mt-2 text-sm text-on-surface-variant">
            {t('payments.recordSummary', {
              from: payer?.name ?? t('common.unknown'),
              to: payee?.name ?? t('common.unknown'),
              amount: formatMoney(initialAmount, initialCurrency),
            })}
          </p>
        </div>
        <button type="button" className="app-icon-button shrink-0" onClick={onClose} aria-label={t('common.close')} disabled={saving}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('payments.from')}</label>
          <select className="app-input" value={selectedFromUserId} onChange={(event) => setFromUserId(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('payments.to')}</label>
          <select className="app-input" value={selectedToUserId} onChange={(event) => setToUserId(event.target.value)}>
            {members.filter((member) => member.id !== selectedFromUserId).map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('payments.amount')}</label>
          <input
            type="number"
            min="0"
            max={maxAmount}
            step="0.01"
            className="app-input"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold text-on-surface-variant">{t('payments.note')}</label>
          <input
            type="text"
            className="app-input"
            placeholder={t('payments.notePlaceholder')}
            value={note}
            maxLength={280}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      {validationError || error ? (
        <div className="mt-4 rounded-xl border border-error/40 bg-error/10 p-3 text-sm font-medium text-error">
          {error || validationError}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="app-button-secondary" onClick={onClose} disabled={saving}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="app-button-primary"
          onClick={handleRecord}
          disabled={saving || invalidAmount || !selectedFromUserId || !selectedToUserId || selectedFromUserId === selectedToUserId}
        >
          {saving ? t('common.saving') : t('payments.record')}
        </button>
      </div>
    </DialogShell>
  );
};

export default RecordGroupPaymentDialog;
