using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Commands;

public record CreateGroupCommand(string Name, string Currency, Guid OwnerId) : IRequest<Guid>;
