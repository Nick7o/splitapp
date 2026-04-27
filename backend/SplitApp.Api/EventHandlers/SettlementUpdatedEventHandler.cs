using MediatR;
using Microsoft.AspNetCore.SignalR;
using SplitApp.Api.Hubs;
using SplitApp.Application.Events;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Api.EventHandlers;

public class SettlementUpdatedEventHandler : INotificationHandler<SettlementUpdatedEvent>
{
    private readonly IHubContext<ExpenseHub> _hubContext;

    public SettlementUpdatedEventHandler(IHubContext<ExpenseHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(SettlementUpdatedEvent notification, CancellationToken cancellationToken)
    {
        await _hubContext.Clients.Group(notification.GroupId.ToString())
            .SendAsync("SettlementUpdated", notification.SettlementId, notification.Status, cancellationToken: cancellationToken);
    }
}
