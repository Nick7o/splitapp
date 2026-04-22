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

public class GetUserGroupsQueryHandler : IRequestHandler<GetUserGroupsQuery, List<GroupDto>>
{
    private readonly IAppDbContext _context;

    public GetUserGroupsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GroupDto>> Handle(GetUserGroupsQuery request, CancellationToken cancellationToken)
    {
        var groups = await _context.GroupMembers
            .Where(gm => gm.UserId == request.UserId)
            .Select(gm => gm.Group)
            .Select(g => new GroupDto
            {
                Id = g.Id,
                Name = g.Name,
                Currency = g.Currency,
                OwnerId = g.OwnerId,
                MyBalance = 0, // TODO: Calculate actual balance
                MembersCount = g.Members.Count,
                LastActive = "Just now", // Placeholder
                ImageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBwOpHqG2cUwVQU36euozERQujJNiwqTVSi9WGRFjIOA1RLWQ4jSSAJbhtwDumCNjrH2NiRU4owtdSWCbwTMyz5apJV6C3neH1M2WsI0Qy8P_17443Ed4yuyaeHPNp0QirNH8FNpVQx6ou5ILKt753VfqXSBoHIQseLEd5UGDaTGXIGWoVwk2sMhNDcRxZztpFbRR7QN2odto5yNvRICX-pRakyB0tqFKQNQ1mawhd7c3dWtjQ2xANwAfWTuWFJVzOH89-5Veh1Veyj" // Placeholder
            })
            .ToListAsync(cancellationToken);

        return groups;
    }
}
