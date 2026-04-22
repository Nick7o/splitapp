using MediatR;
using SplitApp.Application.DTOs;
using System;

namespace SplitApp.Application.Queries;

public record GetGroupDetailsQuery(Guid GroupId, Guid UserId) : IRequest<GroupDetailsDto?>;
