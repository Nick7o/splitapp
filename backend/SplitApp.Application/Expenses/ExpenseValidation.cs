using SplitApp.Application.Commands;
using System;
using System.Collections.Generic;
using System.Linq;

namespace SplitApp.Application.Expenses;

public static class ExpenseValidation
{
    private const int MaxTitleLength = 160;
    private static readonly HashSet<string> AllowedSplitMethods = new(StringComparer.Ordinal)
    {
        "equally",
        "percent",
        "exact"
    };

    public static string NormalizeTitle(string title)
    {
        var normalized = title?.Trim() ?? string.Empty;

        if (normalized.Length == 0 || normalized.Length > MaxTitleLength)
        {
            throw new ArgumentException("expense.invalidTitle");
        }

        return normalized;
    }

    public static string NormalizeSplitMethod(string splitMethod)
    {
        var normalized = string.IsNullOrWhiteSpace(splitMethod)
            ? "equally"
            : splitMethod.Trim().ToLowerInvariant();

        if (!AllowedSplitMethods.Contains(normalized))
        {
            throw new ArgumentException("expense.invalidSplitMethod");
        }

        return normalized;
    }

    public static List<ExpenseSplitDto> NormalizeSplits(IEnumerable<ExpenseSplitDto> splits, decimal totalAmount)
    {
        if (totalAmount <= 0)
        {
            throw new ArgumentException("expense.invalidAmount");
        }

        var normalized = splits?.ToList() ?? new List<ExpenseSplitDto>();

        if (normalized.Count == 0 ||
            normalized.Any(split => split.UserId == Guid.Empty || split.OwedAmount <= 0) ||
            normalized.Select(split => split.UserId).Distinct().Count() != normalized.Count)
        {
            throw new ArgumentException("expense.invalidSplits");
        }

        var splitsSum = normalized.Sum(split => split.OwedAmount);
        if (Math.Abs(splitsSum - totalAmount) > 0.01m)
        {
            throw new ArgumentException("expense.splitSumMismatch");
        }

        return normalized;
    }
}
