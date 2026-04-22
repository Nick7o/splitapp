using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Queries;
using SplitApp.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
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
            .Select(a => new ActivityLogDto
            {
                Id = a.Id,
                Content = a.Content,
                CreatedAt = a.CreatedAt,
                UserName = a.User.Name
            })
            .ToListAsync(cancellationToken);

        return logs;
    }
}
