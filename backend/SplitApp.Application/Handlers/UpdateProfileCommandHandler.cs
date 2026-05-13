using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Application.DTOs;
using SplitApp.Application.Users;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class UpdateProfileCommandHandler : IRequestHandler<UpdateProfileCommand, UserDto>
{
    private readonly IAppDbContext _context;

    public UpdateProfileCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<UserDto> Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException("user.notFound");
        }

        var name = request.Name.Trim();
        if (name.Length == 0 || name.Length > 80)
        {
            throw new ArgumentException("user.invalidName");
        }

        var bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        if (bio?.Length > 280)
        {
            throw new ArgumentException("user.invalidBio");
        }

        user.Name = name;
        user.Bio = bio;
        user.AvatarKey = UserAvatarKeys.Normalize(request.AvatarKey);

        await _context.SaveChangesAsync(cancellationToken);

        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            AvatarKey = user.AvatarKey,
            Bio = user.Bio,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash)
        };
    }
}
