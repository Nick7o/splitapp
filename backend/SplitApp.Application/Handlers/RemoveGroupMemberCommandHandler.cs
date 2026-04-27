using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class RemoveGroupMemberCommandHandler : IRequestHandler<RemoveGroupMemberCommand, bool>
{
    private readonly IAppDbContext _context;

    public RemoveGroupMemberCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RemoveGroupMemberCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .Include(g => g.Expenses)
                .ThenInclude(e => e.Splits)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null)
        {
            throw new KeyNotFoundException("group.notFound");
        }

        var actingMember = group.Members.FirstOrDefault(member => member.UserId == request.ActingUserId);
        if (actingMember == null)
        {
            throw new ArgumentException("group.notMember");
        }

        var targetMember = group.Members.FirstOrDefault(member => member.UserId == request.TargetUserId);
        if (targetMember == null)
        {
            throw new KeyNotFoundException("group.memberNotFound");
        }

        var isOwner = group.OwnerId == request.ActingUserId;
        var isSelfRemoval = request.ActingUserId == request.TargetUserId;

        if (isOwner && isSelfRemoval)
        {
            throw new ArgumentException("group.ownerCannotLeave");
        }

        if (!isOwner && !isSelfRemoval)
        {
            throw new ArgumentException("group.onlyOwnerCan");
        }

        if (HasOutstandingBalance(group, request.TargetUserId))
        {
            throw new ArgumentException("group.memberHasDebts");
        }

        _context.GroupMembers.Remove(targetMember);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static bool HasOutstandingBalance(Domain.Entities.Group group, Guid userId)
    {
        var balancesByCurrency = new Dictionary<string, decimal>(StringComparer.Ordinal);

        foreach (var expense in group.Expenses)
        {
            var currency = string.IsNullOrWhiteSpace(expense.Currency) ? group.Currency : expense.Currency;
            if (!balancesByCurrency.ContainsKey(currency))
            {
                balancesByCurrency[currency] = 0m;
            }

            if (expense.PayerId == userId)
            {
                balancesByCurrency[currency] += expense.TotalAmount;
            }

            var split = expense.Splits.FirstOrDefault(s => s.UserId == userId);
            if (split != null)
            {
                balancesByCurrency[currency] -= split.OwedAmount;
            }
        }

        return balancesByCurrency.Values.Any(amount => Math.Abs(amount) > 0.0001m);
    }
}
