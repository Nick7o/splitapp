using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Groups;
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
    private readonly BalanceCalculator _balanceCalculator;

    public GetGroupDetailsQueryHandler(
        IAppDbContext context,
        DebtOptimizationService debtOptimizationService,
        BalanceCalculator balanceCalculator)
    {
        _context = context;
        _debtOptimizationService = debtOptimizationService;
        _balanceCalculator = balanceCalculator;
    }

    public async Task<GroupDetailsDto?> Handle(GetGroupDetailsQuery request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .Include(g => g.Expenses)
                .ThenInclude(e => e.Splits)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group is null || !group.IsMember(request.UserId))
        {
            return null;
        }

        var payments = await _context.Payments
            .Where(payment => payment.GroupId == request.GroupId)
            .ToListAsync(cancellationToken);

        var balanceSnapshot = _balanceCalculator.Calculate(group, payments);
        var balancesByCurrency = balanceSnapshot.BalancesByCurrency;
        var myBalanceByCurrency = balanceSnapshot.GetUserBalances(request.UserId);
        var myBalance = myBalanceByCurrency.Values.Sum();
        var optimizedDebtsByCurrency = _debtOptimizationService.OptimizeDebts(
            balancesByCurrency.Select(balance => (balance.Key, balance.Value)));
        var flattenedOptimizedDebts = optimizedDebtsByCurrency.Values.SelectMany(debts => debts).ToList();

        return new GroupDetailsDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            AvatarKey = group.AvatarKey,
            DefaultCurrency = group.DefaultCurrency,
            OwnerId = group.GetOwnerId(),
            MyBalance = myBalance,
            MyBalanceByCurrency = myBalanceByCurrency,
            BalancesByCurrency = balancesByCurrency,
            Members = group.Members.Select(member => new UserDto
            {
                Id = member.User.Id,
                Name = member.User.Name,
                Email = member.User.Email,
                AvatarKey = member.User.AvatarKey,
                Bio = member.User.Bio
            }).ToList(),
            Expenses = group.Expenses.Select(expense =>
            {
                var currency = string.IsNullOrWhiteSpace(expense.Currency)
                    ? group.DefaultCurrency
                    : expense.Currency;

                return new ExpenseDto
                {
                    Id = expense.Id,
                    PayerId = expense.PayerId,
                    Title = expense.Title,
                    TotalAmount = expense.TotalAmount,
                    Currency = currency,
                    CreatedAt = expense.CreatedAt,
                    MyShare = expense.Splits.FirstOrDefault(split => split.UserId == request.UserId)?.OwedAmount ?? 0m
                };
            }).OrderByDescending(expense => expense.CreatedAt).ToList(),
            OptimizedDebts = flattenedOptimizedDebts.Select(debt => new DebtTransferDto
            {
                FromUserId = debt.FromUserId,
                ToUserId = debt.ToUserId,
                Amount = debt.Amount
            }).ToList(),
            OptimizedDebtsByCurrency = optimizedDebtsByCurrency.ToDictionary(
                entry => entry.Key,
                entry => entry.Value.Select(debt => new DebtTransferDto
                {
                    FromUserId = debt.FromUserId,
                    ToUserId = debt.ToUserId,
                    Amount = debt.Amount
                }).ToList())
        };
    }
}
