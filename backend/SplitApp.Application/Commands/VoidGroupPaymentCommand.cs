using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record VoidGroupPaymentCommand(Guid PaymentId, Guid ActingUserId) : IRequest;
