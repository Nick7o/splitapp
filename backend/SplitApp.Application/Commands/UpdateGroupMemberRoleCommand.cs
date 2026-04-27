using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record UpdateGroupMemberRoleCommand(
    Guid GroupId,
    Guid ActingUserId,
    Guid TargetUserId,
    int NewRole) : IRequest<bool>;
