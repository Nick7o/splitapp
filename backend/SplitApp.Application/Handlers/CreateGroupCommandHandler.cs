using MediatR;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
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
        var normalizedName = request.Name.Trim();
        if (normalizedName.Length < 1 || normalizedName.Length > 80)
        {
            throw new ArgumentException("group.invalidName");
        }

        var defaultCurrency = IsoCurrencyCodes.Normalize(request.DefaultCurrency);

        var group = new Group
        {
            Name = normalizedName,
            DefaultCurrency = defaultCurrency
        };

        var member = new GroupMember
        {
            Group = group,
            UserId = request.OwnerId,
            Role = GroupMemberRole.Owner
        };

        group.Members.Add(member);

        _context.Groups.Add(group);
        await _context.SaveChangesAsync(cancellationToken);

        return group.Id;
    }
}
