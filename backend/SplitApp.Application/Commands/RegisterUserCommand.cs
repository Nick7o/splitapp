using MediatR;
using SplitApp.Application.DTOs;

namespace SplitApp.Application.Commands;

public record RegisterUserCommand(string Email, string Password, string Name) : IRequest<AuthResponseDto>;
