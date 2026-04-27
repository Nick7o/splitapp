using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Commands;

public record RecordSettlementPaymentCommand(Guid SettlementId, Guid ActingUserId, decimal Amount) : IRequest<SettlementDto>;
