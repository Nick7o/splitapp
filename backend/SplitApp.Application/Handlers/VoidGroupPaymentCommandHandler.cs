using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Activity;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class VoidGroupPaymentCommandHandler : IRequestHandler<VoidGroupPaymentCommand>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public VoidGroupPaymentCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task Handle(VoidGroupPaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _context.SettlementPayments
            .Include(item => item.Settlement)
            .FirstOrDefaultAsync(item => item.Id == request.PaymentId, cancellationToken);

        if (payment is null)
        {
            throw new KeyNotFoundException("payment.notFound");
        }

        var settlement = payment.Settlement;
        var isMember = await _context.GroupMembers
            .AnyAsync(member => member.GroupId == settlement.GroupId && member.UserId == request.ActingUserId, cancellationToken);
        if (!isMember)
        {
            throw new ArgumentException("group.notMember");
        }

        if (settlement.Status == SettlementStatus.Cancelled)
        {
            throw new ArgumentException("payment.alreadyVoided");
        }

        settlement.Status = SettlementStatus.Cancelled;
        settlement.PaidAmount = 0m;
        settlement.ResolvedAt = DateTime.UtcNow;

        var payload = new PaymentVoidedPayload(
            payment.Id,
            settlement.FromUserId,
            settlement.ToUserId,
            payment.Amount,
            settlement.Currency,
            settlement.Note);

        _context.ActivityLogs.Add(new ActivityLog
        {
            GroupId = settlement.GroupId,
            UserId = request.ActingUserId,
            ActivityType = "payment.voided",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options),
            Content = $"voided payment: {payment.Amount} {settlement.Currency}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new SettlementUpdatedEvent(settlement.GroupId, settlement.Id, settlement.Status.ToString()), cancellationToken);
    }
}
