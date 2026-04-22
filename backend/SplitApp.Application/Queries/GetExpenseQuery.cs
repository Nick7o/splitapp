using MediatR;
using SplitApp.Application.Commands;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Queries;

public record GetExpenseQuery(Guid ExpenseId, Guid UserId) : IRequest<ExpenseDetailsDto?>;

public class ExpenseDetailsDto
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public Guid PayerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string SplitMethod { get; set; } = string.Empty;
    public bool IsSettlement { get; set; }
    public List<ExpenseSplitDto> Splits { get; set; } = new();
}
