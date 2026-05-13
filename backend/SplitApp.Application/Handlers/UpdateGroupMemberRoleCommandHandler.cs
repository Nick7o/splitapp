using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Groups;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class UpdateGroupMemberRoleCommandHandler : IRequestHandler<UpdateGroupMemberRoleCommand, bool>
{
    private readonly IAppDbContext _context;

    public UpdateGroupMemberRoleCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateGroupMemberRoleCommand request, CancellationToken cancellationToken)
    {
        if (request.NewRole is < 0 or > 1)
        {
            throw new ArgumentException("group.invalidRole");
        }

        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null)
        {
            throw new KeyNotFoundException("group.notFound");
        }

        if (!group.IsOwner(request.ActingUserId))
        {
            throw new ArgumentException("group.onlyOwnerCan");
        }

        if (group.GetOwnerId() == request.TargetUserId)
        {
            throw new ArgumentException("group.cannotChangeOwnerRole");
        }

        var targetMember = group.Members.FirstOrDefault(member => member.UserId == request.TargetUserId);
        if (targetMember == null)
        {
            throw new KeyNotFoundException("group.memberNotFound");
        }

        targetMember.Role = (GroupMemberRole)request.NewRole;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
