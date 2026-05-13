using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Activity;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.Events;
using SplitApp.Application.Expenses;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class UpdateExpenseCommandHandler : IRequestHandler<UpdateExpenseCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public UpdateExpenseCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<bool> Handle(UpdateExpenseCommand request, CancellationToken cancellationToken)
    {
        var currency = IsoCurrencyCodes.Normalize(request.Currency);
        var title = ExpenseValidation.NormalizeTitle(request.Title);
        var splitMethod = ExpenseValidation.NormalizeSplitMethod(request.SplitMethod);
        var splits = ExpenseValidation.NormalizeSplits(request.Splits, request.TotalAmount);

        var expense = await _context.Expenses
            .Include(e => e.Splits)
            .FirstOrDefaultAsync(e => e.Id == request.ExpenseId && e.GroupId == request.GroupId, cancellationToken);

        if (expense == null) return false;

        var before = CreateSnapshot(expense.Title, expense.TotalAmount, expense.Currency, expense.PayerId, expense.Splits);

        var memberIds = await _context.GroupMembers
            .Where(member => member.GroupId == request.GroupId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        if (!memberIds.Contains(request.UserId))
        {
            throw new ArgumentException("group.notMember");
        }

        if (!memberIds.Contains(request.PayerId) || splits.Any(split => !memberIds.Contains(split.UserId)))
        {
            throw new ArgumentException("expense.usersNotMembers");
        }

        expense.Title = title;
        expense.TotalAmount = request.TotalAmount;
        expense.PayerId = request.PayerId;
        expense.Currency = currency;
        expense.SplitMethod = splitMethod;

        var existingSplits = expense.Splits.ToDictionary(split => split.UserId);
        var nextUserIds = splits.Select(split => split.UserId).ToHashSet();

        foreach (var existingSplit in expense.Splits.Where(split => !nextUserIds.Contains(split.UserId)).ToList())
        {
            _context.ExpenseSplits.Remove(existingSplit);
        }

        foreach (var split in splits)
        {
            if (existingSplits.TryGetValue(split.UserId, out var existingSplit))
            {
                existingSplit.OwedAmount = split.OwedAmount;
                continue;
            }

            _context.ExpenseSplits.Add(new ExpenseSplit
            {
                ExpenseId = expense.Id,
                UserId = split.UserId,
                OwedAmount = split.OwedAmount
            });
        }

        var after = new ExpenseSnapshot(title, request.TotalAmount, currency, request.PayerId, splits);
        var payload = new ExpenseUpdatedPayload(expense.Id, before, after);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.UserId,
            ActivityType = "expense.updated",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options)
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish event to trigger SignalR update
        await _mediator.Publish(new ExpenseCreatedEvent(request.GroupId, expense.Id), cancellationToken);

        return true;
    }

    private static ExpenseSnapshot CreateSnapshot(string title, decimal totalAmount, string currency, Guid payerId, IEnumerable<ExpenseSplit> splits)
    {
        return new ExpenseSnapshot(
            title,
            totalAmount,
            currency,
            payerId,
            splits
                .Select(split => new ExpenseSplitDto(split.UserId, split.OwedAmount))
                .ToList());
    }
}
