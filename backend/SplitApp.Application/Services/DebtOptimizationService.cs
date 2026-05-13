using System;
using System.Collections.Generic;
using System.Linq;

namespace SplitApp.Application.Services;

public class DebtOptimizationService
{
    public List<DebtTransfer> OptimizeDebts(Dictionary<Guid, decimal> balances)
    {
        var debtors = balances.Where(b => b.Value < 0).OrderBy(b => b.Value).ToList();
        var creditors = balances.Where(b => b.Value > 0).OrderByDescending(b => b.Value).ToList();

        var transfers = new List<DebtTransfer>();

        int i = 0, j = 0;

        while (i < debtors.Count && j < creditors.Count)
        {
            var debtor = debtors[i];
            var creditor = creditors[j];

            var amount = Math.Min(Math.Abs(debtor.Value), creditor.Value);

            transfers.Add(new DebtTransfer(debtor.Key, creditor.Key, amount));

            debtors[i] = new KeyValuePair<Guid, decimal>(debtor.Key, debtor.Value + amount);
            creditors[j] = new KeyValuePair<Guid, decimal>(creditor.Key, creditor.Value - amount);

            if (Math.Abs(debtors[i].Value) < 0.01m) i++;
            if (creditors[j].Value < 0.01m) j++;
        }

        return transfers;
    }

    public Dictionary<string, List<DebtTransfer>> OptimizeDebts(
        IEnumerable<(string Currency, Dictionary<Guid, decimal> Balances)> byCurrency)
    {
        var optimized = new Dictionary<string, List<DebtTransfer>>(StringComparer.Ordinal);

        foreach (var (currency, balances) in byCurrency)
        {
            optimized[currency] = OptimizeDebts(balances);
        }

        return optimized;
    }
}

public record DebtTransfer(Guid FromUserId, Guid ToUserId, decimal Amount);
