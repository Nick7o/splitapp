using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Queries;
using SplitApp.Domain.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetExpenseQueryHandler : IRequestHandler<GetExpenseQuery, ExpenseDetailsDto?>
{
    private readonly IAppDbContext _context;

    public GetExpenseQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<ExpenseDetailsDto?> Handle(GetExpenseQuery request, CancellationToken cancellationToken)
    {
        var expense = await _context.Expenses
            .Include(e => e.Splits)
            .Include(e => e.Group)
            .ThenInclude(g => g.Members)
            .FirstOrDefaultAsync(e => e.Id == request.ExpenseId, cancellationToken);

        if (expense == null) return null;

        // Check if user is member of the group
        if (!expense.Group.Members.Any(m => m.UserId == request.UserId)) return null;

        return new ExpenseDetailsDto
        {
            Id = expense.Id,
            GroupId = expense.GroupId,
            PayerId = expense.PayerId,
            Title = expense.Title,
            TotalAmount = expense.TotalAmount,
            Currency = expense.Currency,
            SplitMethod = expense.SplitMethod,
            Splits = expense.Splits.Select(s => new ExpenseSplitDto(s.UserId, s.OwedAmount)).ToList()
        };
    }
}
