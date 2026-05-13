using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record RemoveGroupMemberCommand(
    Guid GroupId,
    Guid ActingUserId,
    Guid TargetUserId) : IRequest<bool>;
