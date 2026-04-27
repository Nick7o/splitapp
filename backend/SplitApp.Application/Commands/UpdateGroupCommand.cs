using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Commands;

public record UpdateGroupCommand(
    Guid GroupId,
    Guid ActingUserId,
    string Name,
    string? Description,
    string? AvatarKey,
    string Currency) : IRequest<GroupDto>;
