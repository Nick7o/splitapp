using MediatR;
using System;

namespace SplitApp.Application.Events;

public record PaymentUpdatedEvent(Guid GroupId, Guid PaymentId, string Status) : INotification;
