using MediatR;
using Microsoft.AspNetCore.SignalR;
using SplitApp.Api.Hubs;
using SplitApp.Application.Events;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Api.EventHandlers;

public class ExpenseCreatedEventHandler : INotificationHandler<ExpenseCreatedEvent>
{
    private readonly IHubContext<ExpenseHub> _hubContext;

    public ExpenseCreatedEventHandler(IHubContext<ExpenseHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task Handle(ExpenseCreatedEvent notification, CancellationToken cancellationToken)
    {
        // Notify all clients in the group that a new expense was added
        await _hubContext.Clients.Group(notification.GroupId.ToString())
            .SendAsync("ExpenseAdded", notification.ExpenseId, cancellationToken: cancellationToken);
    }
}
