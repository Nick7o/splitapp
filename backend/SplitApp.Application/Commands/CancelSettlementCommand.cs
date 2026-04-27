using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record CancelSettlementCommand(Guid SettlementId, Guid ActingUserId) : IRequest<bool>;
