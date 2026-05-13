using MediatR;
using SplitApp.Application.DTOs;

namespace SplitApp.Application.Commands;

public record LoginUserCommand(string Email, string Password) : IRequest<AuthResponseDto>;
