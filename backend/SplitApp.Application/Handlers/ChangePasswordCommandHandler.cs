using MediatR;
using Microsoft.EntityFrameworkCore;
using SplitApp.Application.Commands;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, bool>
{
    private readonly IAppDbContext _context;

    public ChangePasswordCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            throw new KeyNotFoundException("user.notFound");
        }

        if (string.IsNullOrEmpty(user.PasswordHash))
        {
            throw new ArgumentException("password.notSet");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new ArgumentException("auth.invalidCredentials");
        }

        if (request.NewPassword.Length < 8)
        {
            throw new ArgumentException("password.tooShort");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
