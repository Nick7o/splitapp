using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record CreateSettlementCommand(
    Guid GroupId,
    Guid ActingUserId,
    Guid FromUserId,
    Guid ToUserId,
    decimal TotalAmount,
    string Currency,
    string? Note) : IRequest<Guid>;
