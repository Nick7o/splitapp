using MediatR;
using Microsoft.AspNetCore.SignalR;
using SplitApp.Api.Hubs;
using SplitApp.Application.Events;

namespace SplitApp.Api.EventHandlers;

public class PaymentUpdatedEventHandler : INotificationHandler<PaymentUpdatedEvent>
{
    private readonly IHubContext<ExpenseHub> _hubContext;

    public PaymentUpdatedEventHandler(IHubContext<ExpenseHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(PaymentUpdatedEvent notification, CancellationToken cancellationToken)
    {
        await _hubContext.Clients.Group(notification.GroupId.ToString())
            .SendAsync("PaymentUpdated", notification.PaymentId, notification.Status, cancellationToken: cancellationToken);
    }
}
