using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record JoinGroupCommand(Guid GroupId, Guid UserId) : IRequest<bool>;
