using MediatR;
using System;
using System.Collections.Generic;
using System.Text.Json;

namespace SplitApp.Application.Queries;

public record GetGroupActivityQuery(Guid GroupId, Guid UserId) : IRequest<List<ActivityLogDto>>;

public class ActivityLogDto
{
    public Guid Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public JsonElement? Metadata { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string UserName { get; set; } = string.Empty;
}
