using SplitApp.Domain.Entities;

namespace SplitApp.Tests.TestSupport;

public static class TestData
{
    public static User User(
        Guid? id = null,
        string name = "Test User",
        string email = "test@example.com")
    {
        return new User
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
            Email = email
        };
    }

    public static Group GroupWithMembers(
        User owner,
        params User[] members)
    {
        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = "Trip",
            DefaultCurrency = "PLN"
        };

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            Group = group,
            UserId = owner.Id,
            User = owner,
            Role = GroupMemberRole.Owner
        });

        foreach (var member in members)
        {
            group.Members.Add(new GroupMember
            {
                GroupId = group.Id,
                Group = group,
                UserId = member.Id,
                User = member,
                Role = GroupMemberRole.Member
            });
        }

        return group;
    }
}
