using System;

namespace SplitApp.Domain.Entities;

public class SettlementPayment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SettlementId { get; set; }
    public Settlement Settlement { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public Guid RecordedByUserId { get; set; }
    public User RecordedByUser { get; set; } = null!;
}
