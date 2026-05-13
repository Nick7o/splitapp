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

public class GetGroupMembersQueryHandler : IRequestHandler<GetGroupMembersQuery, List<GroupMemberDto>>
{
    private readonly IAppDbContext _context;

    public GetGroupMembersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GroupMemberDto>> Handle(GetGroupMembersQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

        if (!isMember)
        {
            return new List<GroupMemberDto>();
        }

        var members = await _context.GroupMembers
            .Include(gm => gm.User)
            .Where(gm => gm.GroupId == request.GroupId)
            .OrderBy(gm => gm.User.Name)
            .ToListAsync(cancellationToken);

        return members.Select(member => new GroupMemberDto
        {
            UserId = member.UserId,
            Name = member.User.Name,
            Email = member.User.Email,
            AvatarKey = member.User.AvatarKey,
            Bio = member.User.Bio,
            Role = (int)member.Role
        }).ToList();
    }
}
