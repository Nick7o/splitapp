using MediatR;
using SplitApp.Application.DTOs;

namespace SplitApp.Application.Commands;

public record AuthenticateGoogleUserCommand(string GoogleToken) : IRequest<AuthResponseDto>;

public record AuthResponseDto(string Token, UserDto User);
