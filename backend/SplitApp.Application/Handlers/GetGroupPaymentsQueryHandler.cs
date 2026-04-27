using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Queries;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetGroupPaymentsQueryHandler : IRequestHandler<GetGroupPaymentsQuery, List<GroupPaymentDto>>
{
    private readonly IAppDbContext _context;

    public GetGroupPaymentsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GroupPaymentDto>> Handle(GetGroupPaymentsQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _context.GroupMembers
            .AnyAsync(member => member.GroupId == request.GroupId && member.UserId == request.UserId, cancellationToken);
        if (!isMember)
        {
            throw new ArgumentException("group.notMember");
        }

        var payments = await _context.SettlementPayments
            .Include(payment => payment.Settlement)
            .Where(payment => payment.Settlement.GroupId == request.GroupId)
            .OrderByDescending(payment => payment.RecordedAt)
            .ToListAsync(cancellationToken);

        return payments.Select(payment => PaymentMapping.ToDto(payment, payment.Settlement)).ToList();
    }
}
