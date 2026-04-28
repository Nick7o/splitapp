using SplitApp.Domain.Entities;
using System;
using System.Linq;

namespace SplitApp.Application.Groups;

public static class GroupOwnership
{
    public static Guid GetOwnerId(this Group group)
    {
        return group.Members.FirstOrDefault(member => member.Role == GroupMemberRole.Owner)?.UserId ?? Guid.Empty;
    }

    public static bool IsOwner(this Group group, Guid userId)
    {
        return group.Members.Any(member => member.UserId == userId && member.Role == GroupMemberRole.Owner);
    }

    public static bool IsMember(this Group group, Guid userId)
    {
        return group.Members.Any(member => member.UserId == userId);
    }
}
