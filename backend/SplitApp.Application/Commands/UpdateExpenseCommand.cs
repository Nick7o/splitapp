using MediatR;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Commands;

public record UpdateExpenseCommand(
    Guid ExpenseId,
    Guid GroupId,
    Guid PayerId,
    string Title,
    decimal TotalAmount,
    string Currency,
    List<ExpenseSplitDto> Splits,
    Guid UserId,
    string SplitMethod) : IRequest<bool>;
