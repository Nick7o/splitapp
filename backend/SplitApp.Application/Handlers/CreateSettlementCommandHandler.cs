using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class CreateSettlementCommandHandler : IRequestHandler<CreateSettlementCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public CreateSettlementCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<Guid> Handle(CreateSettlementCommand request, CancellationToken cancellationToken)
    {
        if (request.TotalAmount <= 0)
        {
            throw new ArgumentException("settlement.invalidAmount");
        }

        if (request.FromUserId == request.ToUserId)
        {
            throw new ArgumentException("settlement.self");
        }

        var currency = IsoCurrencyCodes.Normalize(request.Currency);
        var memberIds = await _context.GroupMembers
            .Where(member => member.GroupId == request.GroupId)
            .Select(member => member.UserId)
            .ToListAsync(cancellationToken);

        if (!memberIds.Contains(request.ActingUserId))
        {
            throw new ArgumentException("group.notMember");
        }

        if (!memberIds.Contains(request.FromUserId) || !memberIds.Contains(request.ToUserId))
        {
            throw new ArgumentException("settlement.usersNotMembers");
        }

        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        var existingSettlement = await _context.Settlements
            .FirstOrDefaultAsync(settlement =>
                settlement.GroupId == request.GroupId
                && settlement.FromUserId == request.FromUserId
                && settlement.ToUserId == request.ToUserId
                && settlement.Currency == currency
                && (settlement.Status == SettlementStatus.Proposed || settlement.Status == SettlementStatus.PartiallyPaid),
                cancellationToken);

        if (existingSettlement is not null)
        {
            var nextTotalAmount = existingSettlement.PaidAmount + request.TotalAmount;
            if (existingSettlement.TotalAmount != nextTotalAmount)
            {
                existingSettlement.TotalAmount = nextTotalAmount;
            }

            if (note is not null)
            {
                existingSettlement.Note = note;
            }

            await _context.SaveChangesAsync(cancellationToken);
            await _mediator.Publish(new SettlementUpdatedEvent(existingSettlement.GroupId, existingSettlement.Id, existingSettlement.Status.ToString()), cancellationToken);

            return existingSettlement.Id;
        }

        var settlement = new Settlement
        {
            GroupId = request.GroupId,
            FromUserId = request.FromUserId,
            ToUserId = request.ToUserId,
            TotalAmount = request.TotalAmount,
            Currency = currency,
            Note = note
        };

        _context.Settlements.Add(settlement);
        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new SettlementUpdatedEvent(settlement.GroupId, settlement.Id, settlement.Status.ToString()), cancellationToken);

        return settlement.Id;
    }
}
