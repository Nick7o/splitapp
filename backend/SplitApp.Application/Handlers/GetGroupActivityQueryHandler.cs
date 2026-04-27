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

public class GetGroupActivityQueryHandler : IRequestHandler<GetGroupActivityQuery, List<ActivityLogDto>>
{
    private readonly IAppDbContext _context;

    public GetGroupActivityQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ActivityLogDto>> Handle(GetGroupActivityQuery request, CancellationToken cancellationToken)
    {
        var isMember = await _context.GroupMembers
            .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

        if (!isMember) return new List<ActivityLogDto>();

        var logs = await _context.ActivityLogs
            .Include(a => a.User)
            .Where(a => a.GroupId == request.GroupId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

        return logs.Select(a => new ActivityLogDto
        {
            Id = a.Id,
            ActivityType = a.ActivityType,
            Metadata = TryParseMetadata(a.MetadataJson),
            Content = a.Content,
            CreatedAt = a.CreatedAt,
            UserName = a.User.Name
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
