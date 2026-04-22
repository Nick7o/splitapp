using MediatR;
using System;

namespace SplitApp.Application.Events;

public record ExpenseCreatedEvent(Guid GroupId, Guid ExpenseId) : INotification;
