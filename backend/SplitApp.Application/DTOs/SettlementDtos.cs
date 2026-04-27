using System;
using System.Collections.Generic;

namespace SplitApp.Application.DTOs;

public class SettlementDto
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Note { get; set; }
    public List<SettlementPaymentDto> Payments { get; set; } = new();
}

public class SettlementPaymentDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime RecordedAt { get; set; }
    public Guid RecordedByUserId { get; set; }
}
