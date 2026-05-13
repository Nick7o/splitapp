using MediatR;
using System;

namespace SplitApp.Application.Commands;

public record ChangePasswordCommand(Guid UserId, string CurrentPassword, string NewPassword) : IRequest<bool>;
