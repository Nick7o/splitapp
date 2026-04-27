using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Queries;
using SplitApp.Application.Services;
using SplitApp.Domain.Entities;
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

        var balancesByCurrency = new System.Collections.Generic.Dictionary<string, System.Collections.Generic.Dictionary<System.Guid, decimal>>(System.StringComparer.Ordinal);

        foreach (var expense in group.Expenses)
        {
            var currency = string.IsNullOrWhiteSpace(expense.Currency) ? group.Currency : expense.Currency;
            if (!balancesByCurrency.TryGetValue(currency, out var currencyBalances))
            {
                currencyBalances = new System.Collections.Generic.Dictionary<System.Guid, decimal>();
                foreach (var member in group.Members)
                {
                    currencyBalances[member.UserId] = 0m;
                }

                balancesByCurrency[currency] = currencyBalances;
            }

            if (currencyBalances.ContainsKey(expense.PayerId))
            {
                currencyBalances[expense.PayerId] += expense.TotalAmount;
            }

            foreach (var split in expense.Splits)
            {
                if (currencyBalances.ContainsKey(split.UserId))
                {
                    currencyBalances[split.UserId] -= split.OwedAmount;
                }
            }
        }

        var paidSettlements = await _context.Settlements
            .Where(settlement =>
                settlement.GroupId == request.GroupId &&
                settlement.PaidAmount > 0 &&
                (settlement.Status == SettlementStatus.PartiallyPaid || settlement.Status == SettlementStatus.Paid))
            .ToListAsync(cancellationToken);

        foreach (var settlement in paidSettlements)
        {
            if (!balancesByCurrency.TryGetValue(settlement.Currency, out var currencyBalances))
            {
                currencyBalances = new System.Collections.Generic.Dictionary<System.Guid, decimal>();
                foreach (var member in group.Members)
                {
                    currencyBalances[member.UserId] = 0m;
                }

                balancesByCurrency[settlement.Currency] = currencyBalances;
            }

            if (currencyBalances.ContainsKey(settlement.FromUserId))
            {
                currencyBalances[settlement.FromUserId] += settlement.PaidAmount;
            }

            if (currencyBalances.ContainsKey(settlement.ToUserId))
            {
                currencyBalances[settlement.ToUserId] -= settlement.PaidAmount;
            }
        }

        if (balancesByCurrency.Count == 0)
        {
            balancesByCurrency[group.Currency] = group.Members.ToDictionary(m => m.UserId, _ => 0m);
        }

        var myBalanceByCurrency = balancesByCurrency.ToDictionary(
            b => b.Key,
            b => b.Value.TryGetValue(request.UserId, out var amount) ? amount : 0m);

        var myBalance = myBalanceByCurrency.Values.Sum();
        var optimizedDebtsByCurrency = _debtOptimizationService.OptimizeDebts(
            balancesByCurrency.Select(b => (b.Key, b.Value)));
        var flattenedOptimizedDebts = optimizedDebtsByCurrency.Values.SelectMany(x => x).ToList();

        return new GroupDetailsDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            AvatarKey = group.AvatarKey,
            Currency = group.Currency,
            OwnerId = group.OwnerId,
            MyBalance = myBalance,
            MyBalanceByCurrency = myBalanceByCurrency,
            BalancesByCurrency = balancesByCurrency,
            Members = group.Members.Select(m => new UserDto
            {
                Id = m.User.Id,
                Name = m.User.Name,
                Email = m.User.Email,
                AvatarKey = m.User.AvatarKey,
                Bio = m.User.Bio
            }).ToList(),
            Expenses = group.Expenses.Select(e =>
            {
                var currency = string.IsNullOrWhiteSpace(e.Currency) ? group.Currency : e.Currency;
                return new ExpenseDto
                {
                    Id = e.Id,
                    PayerId = e.PayerId,
                    Title = e.Title,
                    TotalAmount = e.TotalAmount,
                    Currency = currency,
                    CreatedAt = e.CreatedAt,
                    IsSettlement = e.IsSettlement,
                    MyShare = e.Splits.FirstOrDefault(s => s.UserId == request.UserId)?.OwedAmount ?? 0
                };
            }).OrderByDescending(e => e.CreatedAt).ToList(),
            OptimizedDebts = flattenedOptimizedDebts.Select(d => new DebtTransferDto
            {
                FromUserId = d.FromUserId,
                ToUserId = d.ToUserId,
                Amount = d.Amount
            }).ToList(),
            OptimizedDebtsByCurrency = optimizedDebtsByCurrency.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Select(d => new DebtTransferDto
                {
                    FromUserId = d.FromUserId,
                    ToUserId = d.ToUserId,
                    Amount = d.Amount
                }).ToList())
        };
    }
}
