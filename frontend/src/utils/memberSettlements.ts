import type { ApiDebtTransfer, ApiUser } from '../types/api';
import type { MemberSettlement } from '../components/MemberProfileDialog';

export const getMemberSettlements = (
  memberId: string,
  debtsByCurrency: Record<string, ApiDebtTransfer[]> | undefined,
  members: Array<Pick<ApiUser, 'id' | 'name'>>,
  unknownLabel: string
): MemberSettlement[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));

  return Object.entries(debtsByCurrency ?? {})
    .flatMap(([currency, debts]) =>
      debts
        .filter((debt) => debt.fromUserId === memberId || debt.toUserId === memberId)
        .map((debt) => {
          const direction: MemberSettlement['direction'] = debt.fromUserId === memberId ? 'pays' : 'gets';
          const otherUserId = direction === 'pays' ? debt.toUserId : debt.fromUserId;

          return {
            currency,
            direction,
            otherName: membersById.get(otherUserId)?.name ?? unknownLabel,
            amount: debt.amount,
          };
        })
    )
    .sort((left, right) => {
      if (left.currency !== right.currency) {
        return left.currency.localeCompare(right.currency);
      }

      if (left.direction !== right.direction) {
        return left.direction === 'pays' ? -1 : 1;
      }

      return right.amount - left.amount;
    });
};
