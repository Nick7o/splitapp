using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Commands;

public record UpdateProfileCommand(Guid UserId, string Name, string? Bio, string? AvatarKey) : IRequest<UserDto>;
