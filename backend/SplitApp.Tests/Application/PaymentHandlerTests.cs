using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Events;
using SplitApp.Application.Handlers;
using SplitApp.Domain.Entities;
using SplitApp.Tests.TestSupport;

namespace SplitApp.Tests.Application;

public class PaymentHandlerTests
{
    [Fact]
    public async Task RecordPayment_persists_recorded_payment_activity_and_event()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        context.Users.AddRange(owner, member);
        context.Groups.Add(group);
        await context.SaveChangesAsync();
        var mediator = new RecordingMediator();

        var handler = new RecordGroupPaymentCommandHandler(context, mediator);
        var dto = await handler.Handle(
            new RecordGroupPaymentCommand(group.Id, owner.Id, member.Id, owner.Id, 25m, "usd", "  bank transfer  "),
            CancellationToken.None);

        var payment = await context.Payments.SingleAsync();
        Assert.Equal(dto.Id, payment.Id);
        Assert.Equal(PaymentStatus.Recorded, payment.Status);
        Assert.Equal("USD", payment.Currency);
        Assert.Equal("bank transfer", payment.Note);
        Assert.Contains(mediator.PublishedNotifications, notification => notification is PaymentUpdatedEvent);
        Assert.Contains(await context.ActivityLogs.ToListAsync(), log => log.ActivityType == "payment.recorded");
    }

    [Fact]
    public async Task RecordPayment_rejects_invalid_users_and_self_payments()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var outsider = TestData.User(name: "Outsider", email: "outsider@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        context.Users.AddRange(owner, member, outsider);
        context.Groups.Add(group);
        await context.SaveChangesAsync();

        var handler = new RecordGroupPaymentCommandHandler(context, new RecordingMediator());

        var self = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new RecordGroupPaymentCommand(group.Id, owner.Id, owner.Id, owner.Id, 10m, "PLN", null),
            CancellationToken.None));
        Assert.Equal("payment.self", self.Message);

        var outsiderPayment = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new RecordGroupPaymentCommand(group.Id, owner.Id, outsider.Id, owner.Id, 10m, "PLN", null),
            CancellationToken.None));
        Assert.Equal("payment.usersNotMembers", outsiderPayment.Message);
    }

    [Fact]
    public async Task VoidPayment_marks_payment_as_voided_and_blocks_double_void()
    {
        await using var context = AppDbContextFactory.Create();
        var owner = TestData.User(name: "Owner", email: "owner@example.com");
        var member = TestData.User(name: "Member", email: "member@example.com");
        var group = TestData.GroupWithMembers(owner, member);
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            FromUserId = member.Id,
            ToUserId = owner.Id,
            Amount = 15m,
            Currency = "PLN",
            Status = PaymentStatus.Recorded,
            RecordedAt = DateTime.UtcNow,
            RecordedByUserId = member.Id
        };
        group.Payments.Add(payment);
        context.Users.AddRange(owner, member);
        context.Groups.Add(group);
        await context.SaveChangesAsync();
        var mediator = new RecordingMediator();

        var handler = new VoidGroupPaymentCommandHandler(context, mediator);
        await handler.Handle(new VoidGroupPaymentCommand(payment.Id, owner.Id), CancellationToken.None);

        var updated = await context.Payments.SingleAsync(item => item.Id == payment.Id);
        Assert.Equal(PaymentStatus.Voided, updated.Status);
        Assert.Equal(owner.Id, updated.VoidedByUserId);
        Assert.NotNull(updated.VoidedAt);
        Assert.Contains(mediator.PublishedNotifications, notification => notification is PaymentUpdatedEvent);
        Assert.Contains(await context.ActivityLogs.ToListAsync(), log => log.ActivityType == "payment.voided");

        var secondVoid = await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(
            new VoidGroupPaymentCommand(payment.Id, owner.Id),
            CancellationToken.None));
        Assert.Equal("payment.alreadyVoided", secondVoid.Message);
    }
}
