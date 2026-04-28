using MediatR;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Commands;

public record CreateExpenseCommand(
    Guid GroupId,
    Guid PayerId,
    Guid UserId,
    string Title,
    decimal TotalAmount,
    string Currency,
    List<ExpenseSplitDto> Splits,
    string SplitMethod) : IRequest<Guid>;

public record ExpenseSplitDto(Guid UserId, decimal OwedAmount);
