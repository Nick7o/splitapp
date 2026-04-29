using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Handlers;
using SplitApp.Application.Queries;
using SplitApp.Application.Services;
using SplitApp.Domain.Entities;
using SplitApp.Tests.TestSupport;

namespace SplitApp.Tests.Application;

public class GroupQueryTests
{
    [Fact]
    public async Task GetGroupDetails_returns_balances_optimized_debts_and_camel_contract_data()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var anna = TestData.User(name: "Anna", email: "anna@example.com");
        var group = TestData.GroupWithMembers(owner, anna);
        group.DefaultCurrency = "PLN";
        group.Description = "Shared trip";
        group.Expenses.Add(new Expense
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Hotel",
            TotalAmount = 100m,
            Currency = "PLN",
            SplitMethod = "exact",
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            Splits = { new ExpenseSplit { UserId = anna.Id, OwedAmount = 100m } }
        });
        group.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            FromUserId = anna.Id,
            ToUserId = owner.Id,
            Amount = 25m,
            Currency = "PLN",
            Status = PaymentStatus.Recorded,
            RecordedAt = DateTime.UtcNow,
            RecordedByUserId = anna.Id
        });
        context.Users.AddRange(owner, anna);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new GetGroupDetailsQueryHandler(
            context,
            new DebtOptimizationService(),
            new BalanceCalculator());
        var dto = await handler.Handle(new GetGroupDetailsQuery(group.Id, anna.Id), CancellationToken.None);

        Assert.NotNull(dto);
        Assert.Equal(group.Id, dto.Id);
        Assert.Equal("PLN", dto.DefaultCurrency);
        Assert.Equal(owner.Id, dto.OwnerId);
        Assert.Equal(-75m, dto.MyBalance);
        Assert.Equal(-75m, dto.MyBalanceByCurrency["PLN"]);
        Assert.Equal(75m, dto.BalancesByCurrency["PLN"][owner.Id]);
        Assert.Single(dto.OptimizedDebtsByCurrency["PLN"]);
        Assert.Equal(anna.Id, dto.OptimizedDebtsByCurrency["PLN"][0].FromUserId);
        Assert.Equal(owner.Id, dto.OptimizedDebtsByCurrency["PLN"][0].ToUserId);
        Assert.Equal(75m, dto.OptimizedDebtsByCurrency["PLN"][0].Amount);
        Assert.Single(dto.Expenses);
        Assert.Equal(100m, dto.Expenses[0].MyShare);
    }

    [Fact]
    public async Task GetUserGroups_includes_payment_adjusted_balances_and_latest_activity()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var anna = TestData.User(name: "Anna", email: "anna@example.com");
        var group = TestData.GroupWithMembers(owner, anna);
        var activityAt = DateTime.UtcNow.AddMinutes(-1);
        group.Expenses.Add(new Expense
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Taxi",
            TotalAmount = 40m,
            Currency = "EUR",
            SplitMethod = "exact",
            Splits = { new ExpenseSplit { UserId = anna.Id, OwedAmount = 40m } }
        });
        group.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            FromUserId = anna.Id,
            ToUserId = owner.Id,
            Amount = 10m,
            Currency = "EUR",
            Status = PaymentStatus.Recorded,
            RecordedAt = DateTime.UtcNow,
            RecordedByUserId = anna.Id
        });
        context.Users.AddRange(owner, anna);
        context.Groups.Add(group);
        context.ActivityLogs.Add(new ActivityLog
        {
            GroupId = group.Id,
            UserId = owner.Id,
            ActivityType = "expense.created",
            CreatedAt = activityAt
        });
        await context.SaveChangesAsync();

        var handler = new GetUserGroupsQueryHandler(context, new BalanceCalculator());
        var groups = await handler.Handle(new GetUserGroupsQuery(anna.Id), CancellationToken.None);

        var dto = Assert.Single(groups);
        Assert.Equal("EUR", dto.MyBalanceByCurrency.Keys.Single());
        Assert.Equal(-30m, dto.MyBalanceByCurrency["EUR"]);
        Assert.Equal(-30m, dto.MyBalance);
        Assert.Equal(activityAt.ToString("O"), dto.LastActive);
    }
}
