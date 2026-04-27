using SplitApp.Application.Commands;
using System;
using System.Collections.Generic;
using System.Text.Json;

namespace SplitApp.Application.Activity;

public record ExpenseCreatedPayload(
    Guid ExpenseId,
    string Title,
    decimal TotalAmount,
    string Currency,
    Guid PayerId,
    IReadOnlyList<ExpenseSplitDto> Splits);

public record ExpenseUpdatedPayload(Guid ExpenseId, ExpenseSnapshot Before, ExpenseSnapshot After);

public record ExpenseDeletedPayload(Guid ExpenseId, ExpenseSnapshot Before);

public record PaymentRecordedPayload(
    Guid PaymentId,
    Guid FromUserId,
    Guid ToUserId,
    decimal Amount,
    string Currency,
    string? Note);

public record PaymentVoidedPayload(
    Guid PaymentId,
    Guid FromUserId,
    Guid ToUserId,
    decimal Amount,
    string Currency,
    string? Note);

public record ExpenseSnapshot(
    string Title,
    decimal TotalAmount,
    string Currency,
    Guid PayerId,
    IReadOnlyList<ExpenseSplitDto> Splits);

public static class ActivityJson
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };
}
