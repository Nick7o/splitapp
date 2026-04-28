using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Activity;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class DeleteExpenseCommandHandler : IRequestHandler<DeleteExpenseCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public DeleteExpenseCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<bool> Handle(DeleteExpenseCommand request, CancellationToken cancellationToken)
    {
        var expense = await _context.Expenses
            .Include(e => e.Splits)
            .Include(e => e.Group)
            .ThenInclude(g => g.Members)
            .FirstOrDefaultAsync(e => e.Id == request.ExpenseId && e.GroupId == request.GroupId, cancellationToken);

        if (expense == null) return false;

        if (!expense.Group.Members.Any(member => member.UserId == request.UserId))
        {
            throw new ArgumentException("group.notMember");
        }

        var before = new ExpenseSnapshot(
            expense.Title,
            expense.TotalAmount,
            expense.Currency,
            expense.PayerId,
            expense.Splits
                .Select(split => new ExpenseSplitDto(split.UserId, split.OwedAmount))
                .ToList());

        _context.ExpenseSplits.RemoveRange(expense.Splits);
        _context.Expenses.Remove(expense);

        var payload = new ExpenseDeletedPayload(expense.Id, before);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.UserId,
            ActivityType = "expense.deleted",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options)
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish event to trigger SignalR update
        await _mediator.Publish(new ExpenseCreatedEvent(request.GroupId, expense.Id), cancellationToken);

        return true;
    }
}
