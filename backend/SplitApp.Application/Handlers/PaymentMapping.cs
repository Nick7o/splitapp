using SplitApp.Application.DTOs;
using SplitApp.Domain.Entities;

namespace SplitApp.Application.Handlers;

internal static class PaymentMapping
{
    public static GroupPaymentDto ToDto(SettlementPayment payment, Settlement settlement)
    {
        return new GroupPaymentDto
        {
            Id = payment.Id,
            GroupId = settlement.GroupId,
            FromUserId = settlement.FromUserId,
            ToUserId = settlement.ToUserId,
            Currency = settlement.Currency,
            Amount = payment.Amount,
            RecordedAt = payment.RecordedAt,
            RecordedByUserId = payment.RecordedByUserId,
            Note = settlement.Note,
            Status = settlement.Status.ToString()
        };
    }
}
