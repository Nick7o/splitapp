import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getActivityMeta, type ActivityTone } from '../data/activityTypes';
import { formatMoney } from '../data/currencies';
import { formatDateTime } from '../utils/date';
import { MemberNameButton } from './MemberIdentity';
import MemberProfileDialog, { type MemberProfile } from './MemberProfileDialog';

export interface ActivityLog {
  id: string;
  userId?: string;
  userName: string;
  createdAt: string;
  content: string;
  activityType: string;
  metadata: unknown;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
}

interface ActivityRowProps {
  log: ActivityLog;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  group?: {
    id: string;
    name: string;
  };
}

interface ExpenseSplit {
  userId: string;
  owedAmount: number;
}

interface ExpenseSnapshot {
  title: string;
  totalAmount: number;
  currency: string;
  payerId: string;
  splits: ExpenseSplit[];
}

interface ExpenseCreatedPayload extends ExpenseSnapshot {
  expenseId: string;
}

interface ExpenseUpdatedPayload {
  expenseId: string;
  before: ExpenseSnapshot;
  after: ExpenseSnapshot;
}

interface ExpenseDeletedPayload {
  expenseId: string;
  before: ExpenseSnapshot;
}

interface PaymentPayload {
  paymentId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  note?: string;
}

const toneClasses: Record<ActivityTone, { icon: string; chip: string }> = {
  positive: {
    icon: 'bg-primary/18 text-primary-fixed ring-primary-fixed/25',
    chip: 'bg-primary/12 text-primary-fixed'
  },
  negative: {
    icon: 'bg-rose-400/15 text-rose-200 ring-rose-300/20',
    chip: 'bg-rose-400/10 text-rose-100'
  },
  neutral: {
    icon: 'bg-secondary/15 text-secondary ring-secondary/20',
    chip: 'bg-secondary/10 text-secondary'
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown): string => (typeof value === 'string' ? value : '');

const getNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const parseSplits = (value: unknown): ExpenseSplit[] => {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((split) => ({
    userId: getString(split.userId),
    owedAmount: getNumber(split.owedAmount)
  }));
};

const parseSnapshot = (value: unknown): ExpenseSnapshot | null => {
  if (!isRecord(value)) return null;

  return {
    title: getString(value.title),
    totalAmount: getNumber(value.totalAmount),
    currency: getString(value.currency) || 'PLN',
    payerId: getString(value.payerId),
    splits: parseSplits(value.splits)
  };
};

const parseCreatedPayload = (value: unknown): ExpenseCreatedPayload | null => {
  const snapshot = parseSnapshot(value);
  if (!snapshot || !isRecord(value)) return null;

  return {
    ...snapshot,
    expenseId: getString(value.expenseId)
  };
};

const parseUpdatedPayload = (value: unknown): ExpenseUpdatedPayload | null => {
  if (!isRecord(value)) return null;

  const before = parseSnapshot(value.before);
  const after = parseSnapshot(value.after);
  if (!before || !after) return null;

  return {
    expenseId: getString(value.expenseId),
    before,
    after
  };
};

const parseDeletedPayload = (value: unknown): ExpenseDeletedPayload | null => {
  if (!isRecord(value)) return null;

  const before = parseSnapshot(value.before);
  if (!before) return null;

  return {
    expenseId: getString(value.expenseId),
    before
  };
};

const parsePaymentPayload = (value: unknown): PaymentPayload | null => {
  if (!isRecord(value)) return null;

  return {
    paymentId: getString(value.paymentId),
    fromUserId: getString(value.fromUserId),
    toUserId: getString(value.toUserId),
    amount: getNumber(value.amount),
    currency: getString(value.currency) || 'PLN',
    note: getString(value.note)
  };
};

const compactId = (id: string, fallback: string): string => (id ? id.slice(0, 8) : fallback);

const memberLabel = (id: string, memberNames: Record<string, string> | undefined, fallback: string): string =>
  memberNames?.[id] ?? compactId(id, fallback);

const money = (amount: number, currency: string): string => formatMoney(amount, currency || 'PLN');

const fallbackContent = (content: string, t: (key: string) => string): string =>
  content || t('activityRow.detailsUnavailable');

const getAmountSummary = (log: ActivityLog): string | null => {
  if (log.activityType === 'expense.created') {
    const payload = parseCreatedPayload(log.metadata);
    return payload ? money(payload.totalAmount, payload.currency) : null;
  }

  if (log.activityType === 'expense.updated') {
    const payload = parseUpdatedPayload(log.metadata);
    if (!payload) return null;
    return money(payload.after.totalAmount, payload.after.currency);
  }

  if (log.activityType === 'expense.deleted') {
    const payload = parseDeletedPayload(log.metadata);
    return payload ? money(payload.before.totalAmount, payload.before.currency) : null;
  }

  if (log.activityType === 'payment.recorded' || log.activityType === 'payment.voided') {
    const payload = parsePaymentPayload(log.metadata);
    return payload ? money(payload.amount, payload.currency) : null;
  }

  return null;
};

const getActivityContent = (
  log: ActivityLog,
  t: (key: string, values?: Record<string, string>) => string,
  memberNames?: Record<string, string>
): string => {
  if (log.activityType === 'expense.created') {
    const payload = parseCreatedPayload(log.metadata);
    return payload
      ? t('activityContent.expenseCreated', { title: payload.title || t('activityRow.untitledExpense'), amount: money(payload.totalAmount, payload.currency) })
      : fallbackContent(log.content, t);
  }

  if (log.activityType === 'expense.updated') {
    const payload = parseUpdatedPayload(log.metadata);
    return payload
      ? t('activityContent.expenseUpdated', { title: payload.after.title || t('activityRow.untitledExpense') })
      : fallbackContent(log.content, t);
  }

  if (log.activityType === 'expense.deleted') {
    const payload = parseDeletedPayload(log.metadata);
    return payload
      ? t('activityContent.expenseDeleted', { title: payload.before.title || t('activityRow.untitledExpense') })
      : fallbackContent(log.content, t);
  }

  if (log.activityType === 'payment.recorded' || log.activityType === 'payment.voided') {
    const payload = parsePaymentPayload(log.metadata);
    if (!payload) return fallbackContent(log.content, t);

    const from = memberLabel(payload.fromUserId, memberNames, t('common.unknown'));
    const to = memberLabel(payload.toUserId, memberNames, t('common.unknown'));
    const amount = money(payload.amount, payload.currency);

    return log.activityType === 'payment.recorded'
      ? t('activityContent.paymentRecorded', { from, to, amount })
      : t('activityContent.paymentVoided', { from, to, amount });
  }

  return fallbackContent(log.content, t);
};

const sameSplits = (left: ExpenseSplit[], right: ExpenseSplit[]): boolean => {
  if (left.length !== right.length) return false;

  const normalize = (splits: ExpenseSplit[]) =>
    splits
      .map((split) => `${split.userId}:${split.owedAmount.toFixed(2)}`)
      .sort()
      .join('|');

  return normalize(left) === normalize(right);
};

const SplitTable: React.FC<{
  splits: ExpenseSplit[];
  currency: string;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  onOpenMember?: (member: MemberProfile) => void;
}> = ({
  splits,
  currency,
  memberNames,
  memberProfiles,
  onOpenMember
}) => {
  const { t } = useTranslation();

  if (splits.length === 0) {
    return <p className="text-sm text-on-surface-variant">{t('activityRow.noSplitDetails')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-on-surface-variant">
          <tr>
            <th className="px-3 py-2 font-semibold">{t('activityRow.member')}</th>
            <th className="px-3 py-2 text-right font-semibold">{t('activityRow.share')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {splits.map((split) => (
            <tr key={`${split.userId}-${split.owedAmount}`}>
              <td className="px-3 py-2 font-medium text-on-surface-variant">
                <MemberNameButton
                  member={memberProfiles?.[split.userId]}
                  fallback={memberLabel(split.userId, memberNames, t('common.unknown'))}
                  onOpen={(member) => onOpenMember?.(member)}
                  className="text-on-surface-variant"
                />
              </td>
              <td className="px-3 py-2 text-right font-semibold text-on-surface">{money(split.owedAmount, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SnapshotDetails: React.FC<{
  snapshot: ExpenseSnapshot;
  title?: string;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  onOpenMember?: (member: MemberProfile) => void;
}> = ({
  snapshot,
  title,
  memberNames,
  memberProfiles,
  onOpenMember
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {title && <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</p>}
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.title')}</p>
          <p className="mt-1 font-semibold text-on-surface">{snapshot.title || t('activityRow.untitledExpense')}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.amount')}</p>
          <p className="mt-1 font-semibold text-on-surface">{money(snapshot.totalAmount, snapshot.currency)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.currency')}</p>
          <p className="mt-1 font-semibold text-on-surface">{snapshot.currency}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.payer')}</p>
          <div className="mt-1">
            <MemberNameButton
              member={memberProfiles?.[snapshot.payerId]}
              fallback={memberLabel(snapshot.payerId, memberNames, t('common.unknown'))}
              onOpen={(member) => onOpenMember?.(member)}
              className="text-on-surface"
            />
          </div>
        </div>
      </div>
      <SplitTable splits={snapshot.splits} currency={snapshot.currency} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} />
    </div>
  );
};

const DiffRow: React.FC<{ label: string; before: string; after: string; changed: boolean }> = ({
  label,
  before,
  after,
  changed
}) => (
  <DiffRowInner label={label} before={before} after={after} changed={changed} />
);

const DiffRowInner: React.FC<{ label: string; before: string; after: string; changed: boolean }> = ({
  label,
  before,
  after,
  changed
}) => {
  const { t } = useTranslation();

  return (
    <div className={`grid gap-2 rounded-lg px-3 py-2 text-sm sm:grid-cols-[8rem_1fr_1fr] ${changed ? 'bg-primary/20' : 'bg-white/5'}`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.before')}</p>
        <p className={`mt-1 break-words ${changed ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{before}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.after')}</p>
        <p className={`mt-1 break-words ${changed ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>{after}</p>
      </div>
    </div>
  );
};

const UpdatedDetails: React.FC<{
  payload: ExpenseUpdatedPayload;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  onOpenMember?: (member: MemberProfile) => void;
}> = ({
  payload,
  memberNames,
  memberProfiles,
  onOpenMember
}) => {
  const { t } = useTranslation();
  const before = payload.before;
  const after = payload.after;
  const splitsChanged = !sameSplits(before.splits, after.splits);

  return (
    <div className="space-y-3">
      <DiffRow label={t('activityRow.title')} before={before.title || t('activityRow.untitledExpense')} after={after.title || t('activityRow.untitledExpense')} changed={before.title !== after.title} />
      <DiffRow label={t('activityRow.amount')} before={money(before.totalAmount, before.currency)} after={money(after.totalAmount, after.currency)} changed={before.totalAmount !== after.totalAmount || before.currency !== after.currency} />
      <DiffRow label={t('activityRow.payer')} before={memberLabel(before.payerId, memberNames, t('common.unknown'))} after={memberLabel(after.payerId, memberNames, t('common.unknown'))} changed={before.payerId !== after.payerId} />
      <div className={`rounded-lg p-3 ${splitsChanged ? 'bg-primary/20' : 'bg-white/5'}`}>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{t('activityRow.splits')}</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.before')}</p>
            <SplitTable splits={before.splits} currency={before.currency} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} />
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.after')}</p>
            <SplitTable splits={after.splits} currency={after.currency} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} />
          </div>
        </div>
      </div>
    </div>
  );
};

const RawDetails: React.FC<{ content: string }> = ({ content }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg bg-white/5 p-3 text-sm text-on-surface-variant">
      {content ? <p>{content}</p> : null}
      <p className={content ? 'mt-2 text-xs' : 'text-xs'}>{t('activityRow.detailsUnavailable')}</p>
    </div>
  );
};

const PaymentDetails: React.FC<{
  payload: PaymentPayload;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  onOpenMember?: (member: MemberProfile) => void;
  voided?: boolean;
}> = ({
  payload,
  memberNames,
  memberProfiles,
  onOpenMember,
  voided = false
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.from')}</p>
          <div className="mt-1">
            <MemberNameButton
              member={memberProfiles?.[payload.fromUserId]}
              fallback={memberLabel(payload.fromUserId, memberNames, t('common.unknown'))}
              onOpen={(member) => onOpenMember?.(member)}
              className="text-on-surface"
            />
          </div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.to')}</p>
          <div className="mt-1">
            <MemberNameButton
              member={memberProfiles?.[payload.toUserId]}
              fallback={memberLabel(payload.toUserId, memberNames, t('common.unknown'))}
              onOpen={(member) => onOpenMember?.(member)}
              className="text-on-surface"
            />
          </div>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.amount')}</p>
          <p className={`mt-1 font-semibold ${voided ? 'text-error line-through' : 'text-on-surface'}`}>{money(payload.amount, payload.currency)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.currency')}</p>
          <p className="mt-1 font-semibold text-on-surface">{payload.currency}</p>
        </div>
      </div>
      {payload.note ? (
        <div className="rounded-lg bg-white/5 px-3 py-2 text-sm">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">{t('activityRow.note')}</p>
          <p className="mt-1 font-semibold text-on-surface">{payload.note}</p>
        </div>
      ) : null}
    </div>
  );
};

const ActivityDetails: React.FC<{
  log: ActivityLog;
  memberNames?: Record<string, string>;
  memberProfiles?: Record<string, MemberProfile>;
  onOpenMember?: (member: MemberProfile) => void;
}> = ({ log, memberNames, memberProfiles, onOpenMember }) => {
  const { t } = useTranslation();

  switch (log.activityType) {
    case 'expense.created': {
      const payload = parseCreatedPayload(log.metadata);
      return payload ? <SnapshotDetails snapshot={payload} title={t('activityRow.createdExpense')} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} /> : <RawDetails content={log.content} />;
    }
    case 'expense.updated': {
      const payload = parseUpdatedPayload(log.metadata);
      return payload ? <UpdatedDetails payload={payload} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} /> : <RawDetails content={log.content} />;
    }
    case 'expense.deleted': {
      const payload = parseDeletedPayload(log.metadata);
      return payload ? <SnapshotDetails snapshot={payload.before} title={t('activityRow.deletedExpenseSnapshot')} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} /> : <RawDetails content={log.content} />;
    }
    case 'payment.recorded': {
      const payload = parsePaymentPayload(log.metadata);
      return payload ? <PaymentDetails payload={payload} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} /> : <RawDetails content={log.content} />;
    }
    case 'payment.voided': {
      const payload = parsePaymentPayload(log.metadata);
      return payload ? <PaymentDetails payload={payload} memberNames={memberNames} memberProfiles={memberProfiles} onOpenMember={onOpenMember} voided /> : <RawDetails content={log.content} />;
    }
    default:
      return <RawDetails content={log.content} />;
  }
};

const ActivityRow: React.FC<ActivityRowProps> = ({ log, memberNames, memberProfiles, group }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const resolvedMemberNames = memberNames ?? log.memberNames;
  const resolvedMemberProfiles = memberProfiles ?? log.memberProfiles;
  const meta = useMemo(() => getActivityMeta(log.activityType), [log.activityType]);
  const classes = toneClasses[meta.tone];
  const canExpand = Boolean(log.metadata) || log.activityType === 'legacy';
  const amountSummary = useMemo(() => getAmountSummary(log), [log]);
  const activityContent = useMemo(
    () => getActivityContent(log, t, resolvedMemberNames),
    [log, resolvedMemberNames, t]
  );

  return (
    <div className="relative flex items-start gap-4">
      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${classes.icon}`}>
        <span className="material-symbols-outlined text-xl">{meta.icon}</span>
      </div>
      <article className="app-card w-full overflow-hidden p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {log.userId && resolvedMemberProfiles?.[log.userId] ? (
                <MemberNameButton
                  member={resolvedMemberProfiles[log.userId]}
                  label={log.userName}
                  fallback={log.userName}
                  onOpen={setSelectedMember}
                  className="text-on-surface"
                />
              ) : (
                <p className="font-bold text-on-surface">{log.userName}</p>
              )}
              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${classes.chip}`}>{t(meta.labelKey)}</span>
              {amountSummary && (
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface">
                  {amountSummary}
                </span>
              )}
            </div>
            {group && (
              <Link
                to={`/groups/${group.id}`}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-secondary transition hover:text-tertiary"
              >
                <span className="material-symbols-outlined text-sm">folder_open</span>
                {group.name}
              </Link>
            )}
            <p className="mt-1 break-words text-sm text-on-surface-variant">{activityContent}</p>
          </div>
          <time className="shrink-0 font-label text-xs text-on-surface-variant">{formatDateTime(log.createdAt)}</time>
        </div>

        {canExpand && (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-secondary transition hover:text-tertiary"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
          >
            <span className="material-symbols-outlined text-base">{expanded ? 'expand_less' : 'expand_more'}</span>
            {expanded ? t('activityRow.hideDetails') : t('activityRow.showDetails')}
          </button>
        )}

        {expanded && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <ActivityDetails log={log} memberNames={resolvedMemberNames} memberProfiles={resolvedMemberProfiles} onOpenMember={setSelectedMember} />
          </div>
        )}
      </article>
      {selectedMember ? (
        <MemberProfileDialog member={selectedMember} onClose={() => setSelectedMember(null)} />
      ) : null}
    </div>
  );
};

export default ActivityRow;
