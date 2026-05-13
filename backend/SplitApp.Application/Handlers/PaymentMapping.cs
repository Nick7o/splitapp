using SplitApp.Application.DTOs;
using SplitApp.Domain.Entities;

namespace SplitApp.Application.Handlers;

internal static class PaymentMapping
{
    public static GroupPaymentDto ToDto(Payment payment)
    {
        return new GroupPaymentDto
        {
            Id = payment.Id,
            GroupId = payment.GroupId,
            FromUserId = payment.FromUserId,
            ToUserId = payment.ToUserId,
            Currency = payment.Currency,
            Amount = payment.Amount,
            RecordedAt = payment.RecordedAt,
            RecordedByUserId = payment.RecordedByUserId,
            VoidedAt = payment.VoidedAt,
            VoidedByUserId = payment.VoidedByUserId,
            Note = payment.Note,
            Status = payment.Status.ToString()
        };
    }
}
