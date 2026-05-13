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

public class CreateExpenseCommandHandler : IRequestHandler<CreateExpenseCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public CreateExpenseCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<Guid> Handle(CreateExpenseCommand request, CancellationToken cancellationToken)
    {
        var currency = IsoCurrencyCodes.Normalize(request.Currency);
        var title = ExpenseValidation.NormalizeTitle(request.Title);
        var splitMethod = ExpenseValidation.NormalizeSplitMethod(request.SplitMethod);
        var splits = ExpenseValidation.NormalizeSplits(request.Splits, request.TotalAmount);

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

        var expense = new Expense
        {
            GroupId = request.GroupId,
            PayerId = request.PayerId,
            Title = title,
            TotalAmount = request.TotalAmount,
            Currency = currency,
            SplitMethod = splitMethod,
            CreatedAt = DateTime.UtcNow,
            Splits = splits.Select(s => new ExpenseSplit
            {
                UserId = s.UserId,
                OwedAmount = s.OwedAmount
            }).ToList()
        };

        _context.Expenses.Add(expense);

        var payload = new ExpenseCreatedPayload(
            expense.Id,
            title,
            request.TotalAmount,
            currency,
            request.PayerId,
            splits);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.UserId,
            ActivityType = "expense.created",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options)
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish event
        await _mediator.Publish(new ExpenseCreatedEvent(request.GroupId, expense.Id), cancellationToken);

        return expense.Id;
    }
}
