using MediatR;
using SplitApp.Application.DTOs;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Queries;

public record GetUserGroupsQuery(Guid UserId) : IRequest<List<GroupDto>>;
