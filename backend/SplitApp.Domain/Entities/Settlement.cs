using System;
using System.Collections.Generic;

namespace SplitApp.Domain.Entities;

public enum SettlementStatus
{
    Proposed = 0,
    PartiallyPaid = 1,
    Paid = 2,
    Cancelled = 3
}

public class Settlement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public Guid FromUserId { get; set; }
    public User FromUser { get; set; } = null!;
    public Guid ToUserId { get; set; }
    public User ToUser { get; set; } = null!;
    public string Currency { get; set; } = "PLN";
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public SettlementStatus Status { get; set; } = SettlementStatus.Proposed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }
    public string? Note { get; set; }
    public ICollection<SettlementPayment> Payments { get; set; } = new List<SettlementPayment>();
}
