using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record DeleteExpenseCommand(Guid ExpenseId, Guid GroupId, Guid UserId) : IRequest<bool>;
