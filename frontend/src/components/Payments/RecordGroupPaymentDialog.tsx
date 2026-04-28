import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { formatMoney } from '../../data/currencies';
import { getApiErrorMessage } from '../../utils/apiError';
import CurrencyPicker from '../CurrencyPicker';
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
  const payer = useMemo(() => members.find((member) => member.id === selectedFromUserId), [members, selectedFromUserId]);
  const payee = useMemo(() => members.find((member) => member.id === selectedToUserId), [members, selectedToUserId]);

  const handleRecord = async () => {
    if (invalidAmount || !selectedFromUserId || !selectedToUserId || selectedFromUserId === selectedToUserId) {
      setError(t('payments.invalidAmount'));
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
      setError(getApiErrorMessage(err, t, 'payments.recordFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="app-card-strong w-full max-w-lg p-6">
        <h3 className="font-headline text-2xl font-bold text-on-surface">{t('payments.recordTitle')}</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t('payments.recordSummary', {
            from: payer?.name ?? t('common.unknown'),
            to: payee?.name ?? t('common.unknown'),
            amount: formatMoney(initialAmount, initialCurrency),
          })}
        </p>

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

        {error ? <div className="mt-4 rounded-xl bg-error/10 p-3 text-sm font-medium text-error">{error}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="app-button-secondary" onClick={onClose}>
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
      </div>
    </div>
  );
};

export default RecordGroupPaymentDialog;
