using MediatR;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Commands;

public record CreateExpenseCommand(
    Guid GroupId,
    Guid PayerId,
    string Title,
    decimal TotalAmount,
    List<ExpenseSplitDto> Splits,
    string SplitMethod,
    bool IsSettlement) : IRequest<Guid>;

public record ExpenseSplitDto(Guid UserId, decimal OwedAmount);
