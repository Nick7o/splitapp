using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Queries;
using SplitApp.Application.Services;
using SplitApp.Domain.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetGroupDetailsQueryHandler : IRequestHandler<GetGroupDetailsQuery, GroupDetailsDto?>
{
    private readonly IAppDbContext _context;
    private readonly DebtOptimizationService _debtOptimizationService;

    public GetGroupDetailsQueryHandler(IAppDbContext context, DebtOptimizationService debtOptimizationService)
    {
        _context = context;
        _debtOptimizationService = debtOptimizationService;
    }

    public async Task<GroupDetailsDto?> Handle(GetGroupDetailsQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Expenses)
                .ThenInclude(e => e.Splits)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null) return null;

        // Check if user is member
        if (!group.Members.Any(m => m.UserId == request.UserId)) return null;

        // Calculate balances
        var balances = new System.Collections.Generic.Dictionary<System.Guid, decimal>();
        foreach (var member in group.Members)
        {
            balances[member.UserId] = 0;
        }

        foreach (var expense in group.Expenses)
        {
            // Payer paid the total amount
            if (balances.ContainsKey(expense.PayerId))
            {
                balances[expense.PayerId] += expense.TotalAmount;
            }

            // Each split owes their share
            foreach (var split in expense.Splits)
            {
                if (balances.ContainsKey(split.UserId))
                {
                    balances[split.UserId] -= split.OwedAmount;
                }
            }
        }

        var myBalance = balances.ContainsKey(request.UserId) ? balances[request.UserId] : 0;

        var optimizedDebts = _debtOptimizationService.OptimizeDebts(balances);

        return new GroupDetailsDto
        {
            Id = group.Id,
            Name = group.Name,
            Currency = group.Currency,
            OwnerId = group.OwnerId,
            MyBalance = myBalance,
            Members = group.Members.Select(m => new UserDto
            {
                Id = m.User.Id,
                Name = m.User.Name,
                Email = m.User.Email
            }).ToList(),
            Expenses = group.Expenses.Select(e => new ExpenseDto
            {
                Id = e.Id,
                PayerId = e.PayerId,
                Title = e.Title,
                TotalAmount = e.TotalAmount,
                CreatedAt = e.CreatedAt,
                IsSettlement = e.IsSettlement,
                MyShare = e.Splits.FirstOrDefault(s => s.UserId == request.UserId)?.OwedAmount ?? 0
            }).OrderByDescending(e => e.CreatedAt).ToList(),
            OptimizedDebts = optimizedDebts.Select(d => new DebtTransferDto
            {
                FromUserId = d.FromUserId,
                ToUserId = d.ToUserId,
                Amount = d.Amount
            }).ToList()
        };
    }
}
