using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Groups;
using SplitApp.Application.Services;
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
    private readonly BalanceCalculator _balanceCalculator;

    public RemoveGroupMemberCommandHandler(IAppDbContext context, BalanceCalculator balanceCalculator)
    {
        _context = context;
        _balanceCalculator = balanceCalculator;
    }

    public async Task<bool> Handle(RemoveGroupMemberCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(item => item.Members)
            .Include(item => item.Expenses)
                .ThenInclude(expense => expense.Splits)
            .FirstOrDefaultAsync(item => item.Id == request.GroupId, cancellationToken);

        if (group is null)
        {
            throw new KeyNotFoundException("group.notFound");
        }

        var actingMember = group.Members.FirstOrDefault(member => member.UserId == request.ActingUserId);
        if (actingMember is null)
        {
            throw new ArgumentException("group.notMember");
        }

        var targetMember = group.Members.FirstOrDefault(member => member.UserId == request.TargetUserId);
        if (targetMember is null)
        {
            throw new KeyNotFoundException("group.memberNotFound");
        }

        var isOwner = group.IsOwner(request.ActingUserId);
        var isSelfRemoval = request.ActingUserId == request.TargetUserId;

        if (isOwner && isSelfRemoval)
        {
            throw new ArgumentException("group.ownerCannotLeave");
        }

        if (!isOwner && !isSelfRemoval)
        {
            throw new ArgumentException("group.onlyOwnerCan");
        }

        var payments = await _context.Payments
            .Where(payment => payment.GroupId == request.GroupId)
            .ToListAsync(cancellationToken);
        if (_balanceCalculator.Calculate(group, payments).HasOutstandingBalance(request.TargetUserId))
        {
            throw new ArgumentException("group.memberHasDebts");
        }

        _context.GroupMembers.Remove(targetMember);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
