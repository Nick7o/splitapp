using System;

namespace SplitApp.Application.DTOs;

public class GroupPaymentDto
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime RecordedAt { get; set; }
    public Guid RecordedByUserId { get; set; }
    public DateTime? VoidedAt { get; set; }
    public Guid? VoidedByUserId { get; set; }
    public string? Note { get; set; }
    public string Status { get; set; } = string.Empty;
}
