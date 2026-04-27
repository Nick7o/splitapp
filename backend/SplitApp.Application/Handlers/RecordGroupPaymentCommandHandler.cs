using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Activity;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.DTOs;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class RecordGroupPaymentCommandHandler : IRequestHandler<RecordGroupPaymentCommand, GroupPaymentDto>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public RecordGroupPaymentCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<GroupPaymentDto> Handle(RecordGroupPaymentCommand request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("payment.invalidAmount");
        }

        if (request.FromUserId == request.ToUserId)
        {
            throw new ArgumentException("payment.self");
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
            throw new ArgumentException("payment.usersNotMembers");
        }

        var now = DateTime.UtcNow;
        var settlement = new Settlement
        {
            GroupId = request.GroupId,
            FromUserId = request.FromUserId,
            ToUserId = request.ToUserId,
            TotalAmount = request.Amount,
            PaidAmount = request.Amount,
            Currency = currency,
            Status = SettlementStatus.Paid,
            CreatedAt = now,
            ResolvedAt = now,
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim()
        };

        var payment = new SettlementPayment
        {
            Settlement = settlement,
            Amount = request.Amount,
            RecordedByUserId = request.ActingUserId,
            RecordedAt = now
        };

        _context.Settlements.Add(settlement);
        _context.SettlementPayments.Add(payment);

        var payload = new PaymentRecordedPayload(
            payment.Id,
            request.FromUserId,
            request.ToUserId,
            request.Amount,
            currency,
            settlement.Note);

        _context.ActivityLogs.Add(new ActivityLog
        {
            GroupId = request.GroupId,
            UserId = request.ActingUserId,
            ActivityType = "payment.recorded",
            MetadataJson = JsonSerializer.Serialize(payload, ActivityJson.Options),
            Content = $"recorded payment: {request.Amount} {currency}"
        });

        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new SettlementUpdatedEvent(settlement.GroupId, settlement.Id, settlement.Status.ToString()), cancellationToken);

        return PaymentMapping.ToDto(payment, settlement);
    }
}
