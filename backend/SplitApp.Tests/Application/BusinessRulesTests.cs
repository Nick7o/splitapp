using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.Expenses;
using SplitApp.Application.Groups;
using SplitApp.Domain.Entities;

namespace SplitApp.Tests.Application;

public class BusinessRulesTests
{
    [Theory]
    [InlineData("pln", "PLN")]
    [InlineData(" eur ", "EUR")]
    [InlineData("USD", "USD")]
    public void CurrencyNormalization_accepts_supported_iso_codes(string input, string expected)
    {
        Assert.Equal(expected, IsoCurrencyCodes.Normalize(input));
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("BTC")]
    [InlineData("TOOLONG")]
    public void CurrencyNormalization_rejects_missing_or_unsupported_codes(string input)
    {
        var ex = Assert.Throws<ArgumentException>(() => IsoCurrencyCodes.Normalize(input));
        Assert.StartsWith("currency.", ex.Message);
    }

    [Fact]
    public void ExpenseValidation_normalizes_title_split_method_and_splits()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        var title = ExpenseValidation.NormalizeTitle("  Dinner  ");
        var method = ExpenseValidation.NormalizeSplitMethod(" EXACT ");
        var splits = ExpenseValidation.NormalizeSplits(
            new[]
            {
                new ExpenseSplitDto(userA, 35m),
                new ExpenseSplitDto(userB, 65m)
            },
            100m);

        Assert.Equal("Dinner", title);
        Assert.Equal("exact", method);
        Assert.Equal(2, splits.Count);
    }

    [Fact]
    public void ExpenseValidation_rejects_duplicate_or_mismatched_splits()
    {
        var userId = Guid.NewGuid();

        var ex = Assert.Throws<ArgumentException>(() => ExpenseValidation.NormalizeSplits(
            new[]
            {
                new ExpenseSplitDto(userId, 20m),
                new ExpenseSplitDto(userId, 30m)
            },
            50m));

        Assert.Equal("expense.invalidSplits", ex.Message);

        var mismatch = Assert.Throws<ArgumentException>(() => ExpenseValidation.NormalizeSplits(
            new[]
            {
                new ExpenseSplitDto(Guid.NewGuid(), 20m),
                new ExpenseSplitDto(Guid.NewGuid(), 30m)
            },
            60m));

        Assert.Equal("expense.splitSumMismatch", mismatch.Message);
    }

    [Fact]
    public void GroupOwnership_reads_owner_from_membership_role()
    {
        var ownerId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var group = new Group
        {
            Members =
            {
                new GroupMember { UserId = memberId, Role = GroupMemberRole.Member },
                new GroupMember { UserId = ownerId, Role = GroupMemberRole.Owner }
            }
        };

        Assert.Equal(ownerId, group.GetOwnerId());
        Assert.True(group.IsOwner(ownerId));
        Assert.False(group.IsOwner(memberId));
        Assert.True(group.IsMember(memberId));
    }
}
