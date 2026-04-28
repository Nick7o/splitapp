using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Queries;
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

    public GetUserGroupsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GroupDto>> Handle(GetUserGroupsQuery request, CancellationToken cancellationToken)
    {
        var groups = await _context.Groups
            .Where(g => g.Members.Any(m => m.UserId == request.UserId))
            .Include(g => g.Members)
            .Include(g => g.Expenses)
                .ThenInclude(e => e.Splits)
            .ToListAsync(cancellationToken);

        var groupIds = groups.Select(group => group.Id).ToList();
        var latestActivityByGroupId = await _context.ActivityLogs
            .Where(log => log.GroupId.HasValue && groupIds.Contains(log.GroupId.Value))
            .GroupBy(log => log.GroupId!.Value)
            .Select(group => new { GroupId = group.Key, LastActiveAt = group.Max(log => log.CreatedAt) })
            .ToDictionaryAsync(item => item.GroupId, item => item.LastActiveAt, cancellationToken);

        var paidSettlements = await _context.Settlements
            .Where(settlement =>
                groupIds.Contains(settlement.GroupId) &&
                settlement.PaidAmount > 0 &&
                (settlement.Status == SettlementStatus.PartiallyPaid || settlement.Status == SettlementStatus.Paid))
            .ToListAsync(cancellationToken);
        var paymentsByGroupId = paidSettlements
            .GroupBy(settlement => settlement.GroupId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var groupDtos = groups.Select(groupEntity =>
        {
            var perCurrency = new Dictionary<string, decimal>(System.StringComparer.Ordinal);
            foreach (var expense in groupEntity.Expenses)
            {
                var currency = string.IsNullOrWhiteSpace(expense.Currency) ? groupEntity.Currency : expense.Currency;
                if (!perCurrency.ContainsKey(currency))
                {
                    perCurrency[currency] = 0m;
                }

                if (expense.PayerId == request.UserId)
                {
                    perCurrency[currency] += expense.TotalAmount;
                }

                var mySplit = expense.Splits.FirstOrDefault(s => s.UserId == request.UserId);
                if (mySplit != null)
                {
                    perCurrency[currency] -= mySplit.OwedAmount;
                }
            }

            if (paymentsByGroupId.TryGetValue(groupEntity.Id, out var groupPayments))
            {
                foreach (var payment in groupPayments)
                {
                    if (!perCurrency.ContainsKey(payment.Currency))
                    {
                        perCurrency[payment.Currency] = 0m;
                    }

                    if (payment.FromUserId == request.UserId)
                    {
                        perCurrency[payment.Currency] += payment.PaidAmount;
                    }

                    if (payment.ToUserId == request.UserId)
                    {
                        perCurrency[payment.Currency] -= payment.PaidAmount;
                    }
                }
            }

            return new GroupDto
            {
                Id = groupEntity.Id,
                Name = groupEntity.Name,
                Description = groupEntity.Description,
                AvatarKey = groupEntity.AvatarKey,
                Currency = groupEntity.Currency,
                OwnerId = groupEntity.OwnerId,
                MyBalance = perCurrency.Values.Sum(),
                MyBalanceByCurrency = perCurrency,
                MembersCount = groupEntity.Members.Count,
                LastActive = latestActivityByGroupId.TryGetValue(groupEntity.Id, out var lastActiveAt)
                    ? lastActiveAt.ToString("O")
                    : string.Empty,
                ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBwOpHqG2cUwVQU36euozERQujJNiwqTVSi9WGRFjIOA1RLWQ4jSSAJbhtwDumCNjrH2NiRU4owtdSWCbwTMyz5apJV6C3neH1M2WsI0Qy8P_17443Ed4yuyaeHPNp0QirNH8FNpVQx6ou5ILKt753VfqXSBoHIQseLEd5UGDaTGXIGWoVwk2sMhNDcRxZztpFbRR7QN2odto5yNvRICX-pRakyB0tqFKQNQ1mawhd7c3dWtjQ2xANwAfWTuWFJVzOH89-5Veh1Veyj" // Placeholder
            };
        }).ToList();

        return groupDtos;
    }
}
