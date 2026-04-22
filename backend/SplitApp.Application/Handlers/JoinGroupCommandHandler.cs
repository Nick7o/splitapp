using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class JoinGroupCommandHandler : IRequestHandler<JoinGroupCommand, bool>
{
    private readonly IAppDbContext _context;

    public JoinGroupCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(JoinGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null) return false;

        // Check if already a member
        if (group.Members.Any(m => m.UserId == request.UserId)) return true;

        try
        {
            group.Members.Add(new GroupMember
            {
                GroupId = request.GroupId,
                UserId = request.UserId,
                Role = 0 // Member
            });

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            // Ignore duplicate key exception if they joined concurrently
            return true;
        }
    }
}
