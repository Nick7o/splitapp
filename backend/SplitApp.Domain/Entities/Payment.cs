using System;

namespace SplitApp.Domain.Entities;

public enum PaymentStatus
{
    Recorded = 0,
    Voided = 1
}

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public Group Group { get; set; } = null!;
    public Guid FromUserId { get; set; }
    public User FromUser { get; set; } = null!;
    public Guid ToUserId { get; set; }
    public User ToUser { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PLN";
    public string? Note { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Recorded;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public Guid RecordedByUserId { get; set; }
    public User RecordedByUser { get; set; } = null!;
    public DateTime? VoidedAt { get; set; }
    public Guid? VoidedByUserId { get; set; }
    public User? VoidedByUser { get; set; }
}
