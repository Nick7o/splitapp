using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Queries;
using SplitApp.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class GetUserActivityQueryHandler : IRequestHandler<GetUserActivityQuery, List<UserActivityLogDto>>
{
    private readonly IAppDbContext _context;

    public GetUserActivityQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserActivityLogDto>> Handle(GetUserActivityQuery request, CancellationToken cancellationToken)
    {
        var groupIds = await _context.GroupMembers
            .Where(gm => gm.UserId == request.UserId)
            .Select(gm => gm.GroupId)
            .ToListAsync(cancellationToken);

        if (groupIds.Count == 0)
        {
            return new List<UserActivityLogDto>();
        }

        var skip = request.Skip < 0 ? 0 : request.Skip;

        var logs = await _context.ActivityLogs
            .Include(a => a.User)
            .Include(a => a.Group)
            .Where(a => a.GroupId.HasValue && groupIds.Contains(a.GroupId.Value))
            .OrderByDescending(a => a.CreatedAt)
            .Skip(skip)
            .Take(request.Take)
            .ToListAsync(cancellationToken);

        return logs.Select(a => new UserActivityLogDto
        {
            Id = a.Id,
            ActivityType = a.ActivityType,
            Metadata = TryParseMetadata(a.MetadataJson),
            Content = a.Content,
            CreatedAt = a.CreatedAt,
            UserName = a.User.Name,
            GroupId = a.GroupId!.Value,
            GroupName = a.Group?.Name ?? string.Empty
        }).ToList();
    }

    private static JsonElement? TryParseMetadata(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(metadataJson);
            return doc.RootElement.Clone();
        }
        catch
        {
            return null;
        }
    }
}
