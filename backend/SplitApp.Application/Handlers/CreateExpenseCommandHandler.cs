using MediatR;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
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
        // Validation: Ensure total amount matches sum of splits
        var splitsSum = request.Splits.Sum(s => s.OwedAmount);
        if (Math.Abs(splitsSum - request.TotalAmount) > 0.01m)
        {
            throw new ArgumentException("Sum of splits must equal total amount");
        }

        var expense = new Expense
        {
            GroupId = request.GroupId,
            PayerId = request.PayerId,
            Title = request.Title,
            TotalAmount = request.TotalAmount,
            SplitMethod = request.SplitMethod,
            IsSettlement = request.IsSettlement,
            CreatedAt = DateTime.UtcNow,
            Splits = request.Splits.Select(s => new ExpenseSplit
            {
                UserId = s.UserId,
                OwedAmount = s.OwedAmount
            }).ToList()
        };

        _context.Expenses.Add(expense);

        var log = new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.PayerId,
            Content = $"dodał(a) wydatek: {request.Title} ({request.TotalAmount})"
        };
        _context.ActivityLogs.Add(log);

        await _context.SaveChangesAsync(cancellationToken);

        // Publish event
        await _mediator.Publish(new ExpenseCreatedEvent(request.GroupId, expense.Id), cancellationToken);

        return expense.Id;
    }
}
