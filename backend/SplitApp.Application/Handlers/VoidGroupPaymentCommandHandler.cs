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
        var payment = await _context.Payments
            .FirstOrDefaultAsync(item => item.Id == request.PaymentId, cancellationToken);

        if (payment is null)
        {
            throw new KeyNotFoundException("payment.notFound");
        }

        var isMember = await _context.GroupMembers
            .AnyAsync(member => member.GroupId == payment.GroupId && member.UserId == request.ActingUserId, cancellationToken);
        if (!isMember)
        {
            throw new ArgumentException("group.notMember");
        }

        if (payment.Status == PaymentStatus.Voided)
        {
            throw new ArgumentException("payment.alreadyVoided");
        }

        payment.Status = PaymentStatus.Voided;
        payment.VoidedAt = DateTime.UtcNow;
        payment.VoidedByUserId = request.ActingUserId;

        var payload = new PaymentVoidedPayload(
            payment.Id,
            payment.FromUserId,
            payment.ToUserId,
            payment.Amount,
            payment.Currency,
            payment.Note);

        _context.ActivityLogs.Add(new ActivityLog
        {
            GroupId = payment.GroupId,
            UserId = request.ActingUserId,
            ActivityType = "payment.voided",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options)
        });

        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new PaymentUpdatedEvent(payment.GroupId, payment.Id, payment.Status.ToString()), cancellationToken);
    }
}
