export type ActivityTone = 'positive' | 'negative' | 'neutral';

export interface ActivityMeta {
  icon: string;
  labelKey: string;
  tone: ActivityTone;
}

export const ACTIVITY_META: Record<string, ActivityMeta> = {
  'expense.created': { icon: 'receipt_long', labelKey: 'activityTypes.expenseCreated', tone: 'positive' },
  'expense.updated': { icon: 'edit', labelKey: 'activityTypes.expenseUpdated', tone: 'neutral' },
  'expense.deleted': { icon: 'delete', labelKey: 'activityTypes.expenseDeleted', tone: 'negative' },
  'payment.recorded': { icon: 'payments', labelKey: 'activityTypes.paymentRecorded', tone: 'positive' },
  'payment.voided': { icon: 'undo', labelKey: 'activityTypes.paymentVoided', tone: 'negative' },
  legacy: { icon: 'history', labelKey: 'activityTypes.activity', tone: 'neutral' }
};

export const getActivityMeta = (type: string): ActivityMeta =>
  ACTIVITY_META[type] ?? { icon: 'history', labelKey: 'activityTypes.activity', tone: 'neutral' };
