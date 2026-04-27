using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.DTOs;
using SplitApp.Application.Queries;
using SplitApp.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetGroupSettlementsQueryHandler : IRequestHandler<GetGroupSettlementsQuery, List<SettlementDto>>
{
    private readonly IAppDbContext _context;

    public GetGroupSettlementsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SettlementDto>> Handle(GetGroupSettlementsQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _context.GroupMembers
            .AnyAsync(member => member.GroupId == request.GroupId && member.UserId == request.UserId, cancellationToken);
        if (!isMember)
        {
            throw new ArgumentException("group.notMember");
        }

        var settlements = await _context.Settlements
            .Include(settlement => settlement.Payments)
            .Where(settlement => settlement.GroupId == request.GroupId)
            .OrderByDescending(settlement => settlement.CreatedAt)
            .ToListAsync(cancellationToken);

        return settlements.Select(SettlementMapping.ToDto).ToList();
    }
}
