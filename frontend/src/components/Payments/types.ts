export type GroupPaymentStatus = 'Proposed' | 'PartiallyPaid' | 'Paid' | 'Cancelled';

export interface GroupPayment {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  currency: string;
  amount: number;
  recordedAt: string;
  recordedByUserId: string;
  note?: string | null;
  status: GroupPaymentStatus;
}

export interface PaymentMember {
  id: string;
  name: string;
  email: string;
  avatarKey?: string | null;
}
