using Google.Apis.Auth;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SplitApp.Application.Commands;
using SplitApp.Application.DTOs;
using SplitApp.Domain.Entities;
using SplitApp.Domain.Interfaces;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace SplitApp.Application.Handlers;

public class AuthenticateGoogleUserCommandHandler : IRequestHandler<AuthenticateGoogleUserCommand, AuthResponseDto>
{
    private readonly IAppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthenticateGoogleUserCommandHandler(IAppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> Handle(AuthenticateGoogleUserCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate Google Token
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _configuration["Authentication:Google:ClientId"] }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(request.GoogleToken, settings);
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("auth.invalidGoogleToken");
        }

        // 2. Find or Create User
        var user = await _context.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject, cancellationToken);
        if (user == null)
        {
            user = new User
            {
                GoogleId = payload.Subject,
                Email = payload.Email,
                Name = payload.Name
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // 3. Generate our own JWT
        var token = GenerateJwtToken(user);

        return new AuthResponseDto(
            Token: token,
            User: new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AvatarKey = user.AvatarKey,
                Bio = user.Bio,
                HasPassword = !string.IsNullOrEmpty(user.PasswordHash)
            }
        );
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("JWT Key is missing.");
        }

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
