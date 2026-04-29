using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Handlers;
using SplitApp.Application.Services;
using SplitApp.Domain.Entities;
using SplitApp.Tests.TestSupport;

namespace SplitApp.Tests.Application;

public class GroupHandlerTests
{
    [Fact]
    public async Task CreateGroup_trims_name_normalizes_currency_and_assigns_owner_role()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User();
        context.Users.Add(owner);
        await context.SaveChangesAsync();

        var handler = new CreateGroupCommandHandler(context);
        var groupId = await handler.Handle(new CreateGroupCommand("  Summer trip  ", "eur", owner.Id), CancellationToken.None);

        var group = await context.Groups.Include(item => item.Members).SingleAsync(item => item.Id == groupId);
        Assert.Equal("Summer trip", group.Name);
        Assert.Equal("EUR", group.DefaultCurrency);
        Assert.Contains(group.Members, member => member.UserId == owner.Id && member.Role == GroupMemberRole.Owner);
    }

    [Fact]
    public async Task UpdateGroup_allows_only_owner_and_returns_computed_owner_id()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        context.Users.AddRange(owner, member);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new UpdateGroupCommandHandler(context);

        var rejected = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new UpdateGroupCommand(group.Id, member.Id, "Name", null, null, "PLN"),
            CancellationToken.None));
        Assert.Equal("group.onlyOwnerCan", rejected.Message);

        var updated = await handler.Handle(
            new UpdateGroupCommand(group.Id, owner.Id, "  City break  ", "  Hotels and food  ", "flight", "usd"),
            CancellationToken.None);

        Assert.Equal("City break", updated.Name);
        Assert.Equal("Hotels and food", updated.Description);
        Assert.Equal("USD", updated.DefaultCurrency);
        Assert.Equal(owner.Id, updated.OwnerId);
        Assert.Equal(2, updated.MembersCount);
    }

    [Fact]
    public async Task RemoveGroupMember_blocks_users_with_open_balances_and_allows_settled_members()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        group.Expenses.Add(new Expense
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            PayerId = owner.Id,
            Title = "Dinner",
            TotalAmount = 50m,
            Currency = "PLN",
            SplitMethod = "exact",
            Splits =
            {
                new ExpenseSplit { UserId = member.Id, OwedAmount = 50m }
            }
        });
        context.Users.AddRange(owner, member);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new RemoveGroupMemberCommandHandler(context, new BalanceCalculator());

        var rejected = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new RemoveGroupMemberCommand(group.Id, owner.Id, member.Id),
            CancellationToken.None));
        Assert.Equal("group.memberHasDebts", rejected.Message);

        context.Payments.Add(new Payment
        {
            GroupId = group.Id,
            FromUserId = member.Id,
            ToUserId = owner.Id,
            Amount = 50m,
            Currency = "PLN",
            Status = PaymentStatus.Recorded,
            RecordedAt = DateTime.UtcNow,
            RecordedByUserId = member.Id
        });
        await context.SaveChangesAsync();

        Assert.True(await handler.Handle(new RemoveGroupMemberCommand(group.Id, owner.Id, member.Id), CancellationToken.None));
        Assert.False(await context.GroupMembers.AnyAsync(item => item.GroupId == group.Id && item.UserId == member.Id));
    }
}
