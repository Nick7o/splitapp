using System;
using System.Collections.Generic;

namespace SplitApp.Domain.Entities;

public class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "PLN";
    public Guid OwnerId { get; set; }

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
