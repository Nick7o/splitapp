using SplitApp.Application.Services;
using SplitApp.Domain.Entities;
using SplitApp.Tests.TestSupport;

namespace SplitApp.Tests.Application;

public class BalanceAndDebtTests
{
    [Fact]
    public void BalanceCalculator_calculates_multi_currency_balances_and_ignores_voided_payments()
    {
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var anna = TestData.User(name: "Anna", email: "anna@example.com");
        var ben = TestData.User(name: "Ben", email: "ben@example.com");
        var group = TestData.GroupWithMembers(owner, anna, ben);

        group.Expenses.Add(new Expense
        {
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Hotel",
            TotalAmount = 120m,
            Currency = "PLN",
            Splits =
            {
                new ExpenseSplit { UserId = anna.Id, OwedAmount = 60m },
                new ExpenseSplit { UserId = ben.Id, OwedAmount = 60m }
            }
        });
        group.Expenses.Add(new Expense
        {
            GroupId = group.Id,
            PayerId = anna.Id,
            Title = "Museum",
            TotalAmount = 60m,
            Currency = "EUR",
            Splits =
            {
                new ExpenseSplit { UserId = owner.Id, OwedAmount = 30m },
                new ExpenseSplit { UserId = ben.Id, OwedAmount = 30m }
            }
        });

        var payments = new[]
        {
            new Payment
            {
                GroupId = group.Id,
                FromUserId = anna.Id,
                ToUserId = owner.Id,
                Amount = 20m,
                Currency = "PLN",
                Status = PaymentStatus.Recorded
            },
            new Payment
            {
                GroupId = group.Id,
                FromUserId = ben.Id,
                ToUserId = owner.Id,
                Amount = 999m,
                Currency = "PLN",
                Status = PaymentStatus.Voided
            }
        };

        var snapshot = new BalanceCalculator().Calculate(group, payments);

        Assert.Equal(100m, snapshot.BalancesByCurrency["PLN"][owner.Id]);
        Assert.Equal(-40m, snapshot.BalancesByCurrency["PLN"][anna.Id]);
        Assert.Equal(-60m, snapshot.BalancesByCurrency["PLN"][ben.Id]);
        Assert.Equal(-30m, snapshot.BalancesByCurrency["EUR"][owner.Id]);
        Assert.Equal(60m, snapshot.BalancesByCurrency["EUR"][anna.Id]);
        Assert.Equal(-30m, snapshot.BalancesByCurrency["EUR"][ben.Id]);
        Assert.True(snapshot.HasOutstandingBalance(ben.Id));
    }

    [Fact]
    public void BalanceCalculator_returns_default_currency_zeroes_for_empty_group()
    {
        var owner = TestData.User();
        var group = TestData.GroupWithMembers(owner);
        group.DefaultCurrency = "EUR";

        var snapshot = new BalanceCalculator().Calculate(group, Array.Empty<Payment>());

        Assert.Single(snapshot.BalancesByCurrency);
        Assert.Equal(0m, snapshot.BalancesByCurrency["EUR"][owner.Id]);
        Assert.False(snapshot.HasOutstandingBalance(owner.Id));
    }

    [Fact]
    public void DebtOptimizationService_returns_transfers_that_settle_each_currency()
    {
        var creditor = Guid.NewGuid();
        var debtorA = Guid.NewGuid();
        var debtorB = Guid.NewGuid();
        var service = new DebtOptimizationService();

        var result = service.OptimizeDebts(new Dictionary<Guid, decimal>
        {
            [creditor] = 100m,
            [debtorA] = -40m,
            [debtorB] = -60m
        });

        Assert.Equal(2, result.Count);
        Assert.Equal(100m, result.Sum(transfer => transfer.Amount));
        Assert.All(result, transfer => Assert.Equal(creditor, transfer.ToUserId));
        Assert.Contains(result, transfer => transfer.FromUserId == debtorA && transfer.Amount == 40m);
        Assert.Contains(result, transfer => transfer.FromUserId == debtorB && transfer.Amount == 60m);
    }
}
