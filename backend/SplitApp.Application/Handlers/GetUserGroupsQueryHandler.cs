using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Groups;
using SplitApp.Application.Queries;
using SplitApp.Application.Services;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetUserGroupsQueryHandler : IRequestHandler<GetUserGroupsQuery, List<GroupDto>>
{
    private readonly IAppDbContext _context;
    private readonly BalanceCalculator _balanceCalculator;

    public GetUserGroupsQueryHandler(IAppDbContext context, BalanceCalculator balanceCalculator)
    {
        _context = context;
        _balanceCalculator = balanceCalculator;
    }

    public async Task<List<GroupDto>> Handle(GetUserGroupsQuery request, CancellationToken cancellationToken)
    {
        var groups = await _context.Groups
            .Where(group => group.Members.Any(member => member.UserId == request.UserId))
            .Include(group => group.Members)
            .Include(group => group.Expenses)
                .ThenInclude(expense => expense.Splits)
            .ToListAsync(cancellationToken);

        var groupIds = groups.Select(group => group.Id).ToList();
        var latestActivityByGroupId = await _context.ActivityLogs
            .Where(log => log.GroupId.HasValue && groupIds.Contains(log.GroupId.Value))
            .GroupBy(log => log.GroupId!.Value)
            .Select(group => new { GroupId = group.Key, LastActiveAt = group.Max(log => log.CreatedAt) })
            .ToDictionaryAsync(item => item.GroupId, item => item.LastActiveAt, cancellationToken);

        var payments = await _context.Payments
            .Where(payment => groupIds.Contains(payment.GroupId))
            .ToListAsync(cancellationToken);
        var paymentsByGroupId = payments
            .GroupBy(payment => payment.GroupId)
            .ToDictionary(group => group.Key, group => group.ToList());

        return groups.Select(group =>
        {
            paymentsByGroupId.TryGetValue(group.Id, out var groupPayments);
            var perCurrency = _balanceCalculator
                .Calculate(group, groupPayments ?? new List<Payment>())
                .GetUserBalances(request.UserId);

            return new GroupDto
            {
                Id = group.Id,
                Name = group.Name,
                Description = group.Description,
                AvatarKey = group.AvatarKey,
                DefaultCurrency = group.DefaultCurrency,
                OwnerId = group.GetOwnerId(),
                MyBalance = perCurrency.Values.Sum(),
                MyBalanceByCurrency = perCurrency,
                MembersCount = group.Members.Count,
                LastActive = latestActivityByGroupId.TryGetValue(group.Id, out var lastActiveAt)
                    ? lastActiveAt.ToString("O")
                    : string.Empty,
                ImageUrl = string.Empty
            };
        }).ToList();
    }
}
