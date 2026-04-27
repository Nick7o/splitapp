using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Activity;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.Events;
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

        var expense = await _context.Expenses
            .Include(e => e.Splits)
            .FirstOrDefaultAsync(e => e.Id == request.ExpenseId && e.GroupId == request.GroupId, cancellationToken);

        if (expense == null) return false;

        var before = CreateSnapshot(expense.Title, expense.TotalAmount, expense.Currency, expense.PayerId, expense.Splits);

        // Validation: Ensure total amount matches sum of splits
        var splitsSum = request.Splits.Sum(s => s.OwedAmount);
        if (Math.Abs(splitsSum - request.TotalAmount) > 0.01m)
        {
            throw new ArgumentException("expense.splitSumMismatch");
        }

        expense.Title = request.Title;
        expense.TotalAmount = request.TotalAmount;
        expense.PayerId = request.PayerId;
        expense.Currency = currency;
        expense.SplitMethod = request.SplitMethod;

        // Update splits
        var existingSplits = await _context.ExpenseSplits.Where(s => s.ExpenseId == expense.Id).ToListAsync(cancellationToken);
        _context.ExpenseSplits.RemoveRange(existingSplits);

        var newSplits = request.Splits.Select(s => new ExpenseSplit
        {
            ExpenseId = expense.Id,
            UserId = s.UserId,
            OwedAmount = s.OwedAmount
        }).ToList();

        _context.ExpenseSplits.AddRange(newSplits);

        var after = new ExpenseSnapshot(request.Title, request.TotalAmount, currency, request.PayerId, request.Splits);
        var payload = new ExpenseUpdatedPayload(expense.Id, before, after);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.UserId,
            ActivityType = "expense.updated",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options),
            Content = $"updated expense: {request.Title}"
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
