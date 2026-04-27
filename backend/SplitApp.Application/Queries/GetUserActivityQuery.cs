using MediatR;
using System;
using System.Collections.Generic;

namespace SplitApp.Application.Queries;

public record GetUserActivityQuery(Guid UserId, int Skip, int Take) : IRequest<List<UserActivityLogDto>>;

public class UserActivityLogDto : ActivityLogDto
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
}
