using System;

namespace SplitApp.Domain.Entities;

public enum GroupMemberRole
{
    Member = 0,
    Admin = 1,
    Owner = 2
}

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
}
