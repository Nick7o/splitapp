using MediatR;
using SplitApp.Application.Commands;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class CreateGroupCommandHandler : IRequestHandler<CreateGroupCommand, Guid>
{
    private readonly IAppDbContext _context;

    public CreateGroupCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateGroupCommand request, CancellationToken cancellationToken)
    {
        var group = new Group
        {
            Name = request.Name,
            Currency = request.Currency,
            OwnerId = request.OwnerId
        };

        var member = new GroupMember
        {
            Group = group,
            UserId = request.OwnerId,
            Role = 1 // Admin
        };

        group.Members.Add(member);

        _context.Groups.Add(group);
        await _context.SaveChangesAsync(cancellationToken);

        return group.Id;
    }
}
