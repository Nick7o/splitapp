using System;

namespace SplitApp.Domain.Entities;

public class GroupMember
{
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public int Role { get; set; } // 0 = Member, 1 = Admin
}
