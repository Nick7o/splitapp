using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class CancelSettlementCommandHandler : IRequestHandler<CancelSettlementCommand, bool>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public CancelSettlementCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<bool> Handle(CancelSettlementCommand request, CancellationToken cancellationToken)
    {
        var settlement = await _context.Settlements.FirstOrDefaultAsync(s => s.Id == request.SettlementId, cancellationToken);
        if (settlement is null)
        {
            throw new KeyNotFoundException("settlement.notFound");
        }

        if (settlement.ActingUserCannotCancel(request.ActingUserId))
        {
            throw new ArgumentException("settlement.notAllowed");
        }

        if (settlement.Status is SettlementStatus.Paid or SettlementStatus.Cancelled)
        {
            throw new ArgumentException("settlement.closed");
        }

        settlement.Status = SettlementStatus.Cancelled;
        settlement.ResolvedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new SettlementUpdatedEvent(settlement.GroupId, settlement.Id, settlement.Status.ToString()), cancellationToken);

        return true;
    }
}

internal static class SettlementCancelPolicy
{
    public static bool ActingUserCannotCancel(this Settlement settlement, Guid actingUserId)
    {
        return settlement.FromUserId != actingUserId && settlement.ToUserId != actingUserId;
    }
}
