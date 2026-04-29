using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Application.Handlers;
using SplitApp.Domain.Entities;
using SplitApp.Tests.TestSupport;

namespace SplitApp.Tests.Application;

public class ExpenseHandlerTests
{
    [Fact]
    public async Task CreateExpense_validates_membership_persists_activity_and_publishes_event()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        context.Users.AddRange(owner, member);
        context.Groups.Add(group);
        await context.SaveChangesAsync();
        var mediator = new RecordingMediator();

        var handler = new CreateExpenseCommandHandler(context, mediator);
        var expenseId = await handler.Handle(
            new CreateExpenseCommand(
                group.Id,
                owner.Id,
                owner.Id,
                "  Groceries  ",
                80m,
                "pln",
                new List<ExpenseSplitDto>
                {
                    new(member.Id, 50m),
                    new(owner.Id, 30m)
                },
                " EXACT "),
            CancellationToken.None);

        var expense = await context.Expenses.Include(item => item.Splits).SingleAsync(item => item.Id == expenseId);
        Assert.Equal("Groceries", expense.Title);
        Assert.Equal("PLN", expense.Currency);
        Assert.Equal("exact", expense.SplitMethod);
        Assert.Equal(2, expense.Splits.Count);
        Assert.Contains(mediator.PublishedNotifications, notification => notification is ExpenseCreatedEvent);
        Assert.Contains(await context.ActivityLogs.ToListAsync(), log => log.ActivityType == "expense.created" && log.UserId == owner.Id);
    }

    [Fact]
    public async Task CreateExpense_rejects_payer_or_splits_outside_group()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var outsider = TestData.User(name: "Outsider", email: "outsider@example.com");
        var group = TestData.GroupWithMembers(owner);
        context.Users.AddRange(owner, outsider);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new CreateExpenseCommandHandler(context, new RecordingMediator());

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new CreateExpenseCommand(
                group.Id,
                owner.Id,
                owner.Id,
                "Taxi",
                40m,
                "PLN",
                new List<ExpenseSplitDto> { new(outsider.Id, 40m) },
                "exact"),
            CancellationToken.None));

        Assert.Equal("expense.usersNotMembers", ex.Message);
    }

    [Fact]
    public async Task UpdateExpense_updates_composite_key_splits_without_duplicate_tracking()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var anna = TestData.User(name: "Anna", email: "anna@example.com");
        var ben = TestData.User(name: "Ben", email: "ben@example.com");
        var group = TestData.GroupWithMembers(owner, anna, ben);
        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Old",
            TotalAmount = 100m,
            Currency = "PLN",
            SplitMethod = "exact",
            Splits =
            {
                new ExpenseSplit { UserId = owner.Id, OwedAmount = 50m },
                new ExpenseSplit { UserId = anna.Id, OwedAmount = 50m }
            }
        };
        group.Expenses.Add(expense);
        context.Users.AddRange(owner, anna, ben);
        context.Groups.Add(group);
        await context.SaveChangesAsync();
        var mediator = new RecordingMediator();

        var handler = new UpdateExpenseCommandHandler(context, mediator);
        var result = await handler.Handle(
            new UpdateExpenseCommand(
                expense.Id,
                group.Id,
                anna.Id,
                "  Updated  ",
                90m,
                "eur",
                new List<ExpenseSplitDto>
                {
                    new(anna.Id, 60m),
                    new(ben.Id, 30m)
                },
                owner.Id,
                "exact"),
            CancellationToken.None);

        Assert.True(result);
        var updated = await context.Expenses.Include(item => item.Splits).SingleAsync(item => item.Id == expense.Id);
        Assert.Equal("Updated", updated.Title);
        Assert.Equal("EUR", updated.Currency);
        Assert.Equal(2, updated.Splits.Count);
        Assert.DoesNotContain(updated.Splits, split => split.UserId == owner.Id);
        Assert.Contains(updated.Splits, split => split.UserId == anna.Id && split.OwedAmount == 60m);
        Assert.Contains(updated.Splits, split => split.UserId == ben.Id && split.OwedAmount == 30m);
        Assert.Contains(mediator.PublishedNotifications, notification => notification is ExpenseCreatedEvent);
    }

    [Fact]
    public async Task DeleteExpense_requires_group_membership()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var outsider = TestData.User(name: "Outsider", email: "outsider@example.com");
        var group = TestData.GroupWithMembers(owner);
        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Lunch",
            TotalAmount = 20m,
            Currency = "PLN",
            SplitMethod = "exact",
            Splits = { new ExpenseSplit { UserId = owner.Id, OwedAmount = 20m } }
        };
        group.Expenses.Add(expense);
        context.Users.AddRange(owner, outsider);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new DeleteExpenseCommandHandler(context, new RecordingMediator());

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new DeleteExpenseCommand(expense.Id, group.Id, outsider.Id),
            CancellationToken.None));

        Assert.Equal("group.notMember", ex.Message);
    }
}
