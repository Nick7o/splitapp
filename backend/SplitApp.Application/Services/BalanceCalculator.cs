using SplitApp.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SplitApp.Application.Services;

public class GroupBalanceSnapshot
{
    public GroupBalanceSnapshot(Dictionary<string, Dictionary<Guid, decimal>> balancesByCurrency)
    {
        BalancesByCurrency = balancesByCurrency;
    }

    public Dictionary<string, Dictionary<Guid, decimal>> BalancesByCurrency { get; }

    public Dictionary<string, decimal> GetUserBalances(Guid userId)
    {
        return BalancesByCurrency.ToDictionary(
            entry => entry.Key,
            entry => entry.Value.TryGetValue(userId, out var amount) ? amount : 0m,
            StringComparer.Ordinal);
    }

    public bool HasOutstandingBalance(Guid userId)
    {
        return BalancesByCurrency.Values.Any(balance =>
            balance.TryGetValue(userId, out var amount) && Math.Abs(amount) > 0.0001m);
    }
}

public class BalanceCalculator
{
    public GroupBalanceSnapshot Calculate(Group group, IEnumerable<Payment> payments)
    {
        var balancesByCurrency = new Dictionary<string, Dictionary<Guid, decimal>>(StringComparer.Ordinal);

        foreach (var expense in group.Expenses)
        {
            var currency = NormalizeCurrency(expense.Currency, group.DefaultCurrency);
            var balances = GetCurrencyBalances(balancesByCurrency, currency, group.Members);

            if (balances.ContainsKey(expense.PayerId))
            {
                balances[expense.PayerId] += expense.TotalAmount;
            }

            foreach (var split in expense.Splits)
            {
                if (balances.ContainsKey(split.UserId))
                {
                    balances[split.UserId] -= split.OwedAmount;
                }
            }
        }

        foreach (var payment in payments.Where(payment => payment.Status == PaymentStatus.Recorded))
        {
            var currency = NormalizeCurrency(payment.Currency, group.DefaultCurrency);
            var balances = GetCurrencyBalances(balancesByCurrency, currency, group.Members);

            if (balances.ContainsKey(payment.FromUserId))
            {
                balances[payment.FromUserId] += payment.Amount;
            }

            if (balances.ContainsKey(payment.ToUserId))
            {
                balances[payment.ToUserId] -= payment.Amount;
            }
        }

        if (balancesByCurrency.Count == 0)
        {
            balancesByCurrency[group.DefaultCurrency] = CreateZeroBalances(group.Members);
        }

        return new GroupBalanceSnapshot(balancesByCurrency);
    }

    private static Dictionary<Guid, decimal> GetCurrencyBalances(
        Dictionary<string, Dictionary<Guid, decimal>> balancesByCurrency,
        string currency,
        IEnumerable<GroupMember> members)
    {
        if (!balancesByCurrency.TryGetValue(currency, out var balances))
        {
            balances = CreateZeroBalances(members);
            balancesByCurrency[currency] = balances;
        }

        return balances;
    }

    private static Dictionary<Guid, decimal> CreateZeroBalances(IEnumerable<GroupMember> members)
    {
        return members.ToDictionary(member => member.UserId, _ => 0m);
    }

    private static string NormalizeCurrency(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value;
    }
}
