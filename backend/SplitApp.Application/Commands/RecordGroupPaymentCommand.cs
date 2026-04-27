using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Commands;

public record RecordGroupPaymentCommand(
    Guid GroupId,
    Guid ActingUserId,
    Guid FromUserId,
    Guid ToUserId,
    decimal Amount,
    string Currency,
    string? Note) : IRequest<GroupPaymentDto>;
