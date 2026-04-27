using System;
using System.Collections.Generic;

namespace SplitApp.Domain.Entities;

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid PayerId { get; set; }
    public User Payer { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "PLN";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string SplitMethod { get; set; } = "equally";
    public bool IsSettlement { get; set; } = false;

    public ICollection<ExpenseSplit> Splits { get; set; } = new List<ExpenseSplit>();
}
