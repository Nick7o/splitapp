using MediatR;
using System;

namespace SplitApp.Application.Events;

public record SettlementUpdatedEvent(Guid GroupId, Guid SettlementId, string Status) : INotification;
