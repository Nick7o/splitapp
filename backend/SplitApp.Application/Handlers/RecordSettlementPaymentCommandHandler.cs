using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.DTOs;
using SplitApp.Application.Events;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class RecordSettlementPaymentCommandHandler : IRequestHandler<RecordSettlementPaymentCommand, SettlementDto>
{
    private readonly IAppDbContext _context;
    private readonly IMediator _mediator;

    public RecordSettlementPaymentCommandHandler(IAppDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<SettlementDto> Handle(RecordSettlementPaymentCommand request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("settlement.invalidAmount");
        }

        var settlement = await _context.Settlements
            .Include(s => s.Payments)
            .FirstOrDefaultAsync(s => s.Id == request.SettlementId, cancellationToken);

        if (settlement is null)
        {
            throw new KeyNotFoundException("settlement.notFound");
        }

        var isMember = await _context.GroupMembers
            .AnyAsync(member => member.GroupId == settlement.GroupId && member.UserId == request.ActingUserId, cancellationToken);
        if (!isMember)
        {
            throw new ArgumentException("group.notMember");
        }

        if (settlement.Status is SettlementStatus.Paid or SettlementStatus.Cancelled)
        {
            throw new ArgumentException("settlement.closed");
        }

        var remaining = settlement.TotalAmount - settlement.PaidAmount;
        if (remaining <= 0)
        {
            throw new ArgumentException("settlement.closed");
        }

        if (request.Amount > remaining)
        {
            throw new ArgumentException("settlement.overpay");
        }

        var now = DateTime.UtcNow;
        var payment = new SettlementPayment
        {
            SettlementId = settlement.Id,
            Settlement = settlement,
            Amount = request.Amount,
            RecordedByUserId = request.ActingUserId,
            RecordedAt = now
        };

        _context.SettlementPayments.Add(payment);

        var nextPaidAmount = settlement.PaidAmount + request.Amount;
        settlement.PaidAmount = nextPaidAmount >= settlement.TotalAmount ? settlement.TotalAmount : nextPaidAmount;
        settlement.Status = settlement.PaidAmount >= settlement.TotalAmount
            ? SettlementStatus.Paid
            : SettlementStatus.PartiallyPaid;
        settlement.ResolvedAt = settlement.Status == SettlementStatus.Paid ? now : null;

        await _context.SaveChangesAsync(cancellationToken);
        await _mediator.Publish(new SettlementUpdatedEvent(settlement.GroupId, settlement.Id, settlement.Status.ToString()), cancellationToken);

        return SettlementMapping.ToDto(settlement);
    }
}
