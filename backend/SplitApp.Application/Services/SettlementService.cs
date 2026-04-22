namespace SplitApp.Application.Services;

public record Settlement(int DebtorId, int CreditorId, decimal Amount);

public class SettlementService
{
    public List<Settlement> SimplifyDebts(Dictionary<int, decimal> netBalances)
    {
        var settlements = new List<Settlement>();
        
        var debtors = netBalances.Where(x => x.Value < 0)
            .Select(x => new { Id = x.Key, Amount = Math.Abs(x.Value) })
            .OrderByDescending(x => x.Amount)
            .ToList();

        var creditors = netBalances.Where(x => x.Value > 0)
            .Select(x => new { Id = x.Key, Amount = x.Value })
            .OrderByDescending(x => x.Amount)
            .ToList();

        int dIdx = 0, cIdx = 0;
        
        while (dIdx < debtors.Count && cIdx < creditors.Count)
        {
            var debtor = debtors[dIdx];
            var creditor = creditors[cIdx];

            decimal settlementAmount = Math.Min(debtor.Amount, creditor.Amount);

            if (settlementAmount > 0)
            {
                settlements.Add(new Settlement(debtor.Id, creditor.Id, settlementAmount));
            }
            
            debtors[dIdx] = debtor with { Amount = debtor.Amount - settlementAmount };
            creditors[cIdx] = creditor with { Amount = creditor.Amount - settlementAmount };

            if (debtors[dIdx].Amount == 0) 
                dIdx++;
            if (creditors[cIdx].Amount == 0) 
                cIdx++;
        }

        return settlements;
    }
}