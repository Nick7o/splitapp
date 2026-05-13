export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
  bio?: string | null;
  hasPassword?: boolean;
}

export interface ApiGroupMember {
  userId: string;
  name: string;
  email: string;
  avatarKey?: string | null;
  bio?: string | null;
  role: number;
}

export interface ApiExpenseSummary {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  payerId: string;
  createdAt: string;
  myShare: number;
}

export interface ApiExpenseSplit {
  userId: string;
  owedAmount: number;
}

export interface ApiExpenseDetails {
  id: string;
  groupId: string;
  payerId: string;
  title: string;
  totalAmount: number;
  currency: string;
  splitMethod: 'equally' | 'percent' | 'exact';
  splits: ApiExpenseSplit[];
}

export interface ApiDebtTransfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface ApiGroup {
  id: string;
  name: string;
  description?: string | null;
  avatarKey?: string | null;
  defaultCurrency: string;
  ownerId: string;
  myBalance: number;
  myBalanceByCurrency: Record<string, number>;
  membersCount: number;
  lastActive: string;
  imageUrl: string;
}

export interface ApiGroupDetails extends ApiGroup {
  members: ApiUser[];
  expenses: ApiExpenseSummary[];
  balancesByCurrency: Record<string, Record<string, number>>;
  optimizedDebts: ApiDebtTransfer[];
  optimizedDebtsByCurrency: Record<string, ApiDebtTransfer[]>;
}

export type GroupPaymentStatus = 'Recorded' | 'Voided';

export interface ApiGroupPayment {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  currency: string;
  amount: number;
  recordedAt: string;
  recordedByUserId: string;
  voidedAt?: string | null;
  voidedByUserId?: string | null;
  note?: string | null;
  status: GroupPaymentStatus;
}

export interface ApiProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
}
