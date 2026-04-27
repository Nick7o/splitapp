using SplitApp.Application.DTOs;
using SplitApp.Domain.Entities;
using System.Linq;

namespace SplitApp.Application.Handlers;

internal static class SettlementMapping
{
    public static SettlementDto ToDto(Settlement settlement)
    {
        return new SettlementDto
        {
            Id = settlement.Id,
            GroupId = settlement.GroupId,
            FromUserId = settlement.FromUserId,
            ToUserId = settlement.ToUserId,
            Currency = settlement.Currency,
            TotalAmount = settlement.TotalAmount,
            PaidAmount = settlement.PaidAmount,
            RemainingAmount = settlement.TotalAmount - settlement.PaidAmount,
            Status = settlement.Status.ToString(),
            CreatedAt = settlement.CreatedAt,
            ResolvedAt = settlement.ResolvedAt,
            Note = settlement.Note,
            Payments = settlement.Payments
                .OrderByDescending(payment => payment.RecordedAt)
                .Select(payment => new SettlementPaymentDto
                {
                    Id = payment.Id,
                    Amount = payment.Amount,
                    RecordedAt = payment.RecordedAt,
                    RecordedByUserId = payment.RecordedByUserId
                })
                .ToList()
        };
    }
}
