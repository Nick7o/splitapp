using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.Currency;
using SplitApp.Application.DTOs;
using SplitApp.Application.Groups;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class UpdateGroupCommandHandler : IRequestHandler<UpdateGroupCommand, GroupDto>
{
    private readonly IAppDbContext _context;

    public UpdateGroupCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GroupDto> Handle(UpdateGroupCommand request, CancellationToken cancellationToken)
    {
        var group = await _context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);

        if (group == null)
        {
            throw new KeyNotFoundException("group.notFound");
        }

        if (!group.IsOwner(request.ActingUserId))
        {
            throw new ArgumentException("group.onlyOwnerCan");
        }

        var normalizedName = request.Name.Trim();
        if (normalizedName.Length < 1 || normalizedName.Length > 80)
        {
            throw new ArgumentException("group.invalidName");
        }

        var normalizedDescription = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        if (normalizedDescription is { Length: > 280 })
        {
            throw new ArgumentException("group.invalidDescription");
        }

        var normalizedAvatarKey = GroupAvatarKeys.Normalize(request.AvatarKey);
        var normalizedCurrency = IsoCurrencyCodes.Normalize(request.DefaultCurrency);

        group.Name = normalizedName;
        group.Description = normalizedDescription;
        group.AvatarKey = normalizedAvatarKey;
        group.DefaultCurrency = normalizedCurrency;

        await _context.SaveChangesAsync(cancellationToken);

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description,
            AvatarKey = group.AvatarKey,
            DefaultCurrency = group.DefaultCurrency,
            OwnerId = group.GetOwnerId(),
            MembersCount = group.Members.Count
        };
    }
}
