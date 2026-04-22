using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
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
            .FirstOrDefaultAsync(e => e.Id == request.ExpenseId && e.GroupId == request.GroupId, cancellationToken);

        if (expense == null) return false;

        _context.ExpenseSplits.RemoveRange(expense.Splits);
        _context.Expenses.Remove(expense);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.UserId,
            Content = $"usunął(ęła) wydatek: {expense.Title}"
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish event to trigger SignalR update
        await _mediator.Publish(new ExpenseCreatedEvent(request.GroupId, expense.Id), cancellationToken);

        return true;
    }
}
