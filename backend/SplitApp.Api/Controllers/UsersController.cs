using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitApp.Api.Infrastructure;
using SplitApp.Application.Commands;
using SplitApp.Application.DTOs;
using SplitApp.Domain.Interfaces;

namespace SplitApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public UsersController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return ApiProblemDetails.Result("user.notFound", StatusCodes.Status404NotFound);

        return Ok(new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            AvatarKey = user.AvatarKey,
            Bio = user.Bio,
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash)
        });
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        return Ok(await _mediator.Send(new UpdateProfileCommand(userId, request.Name, request.Bio, request.AvatarKey)));
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        await _mediator.Send(new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword));
        return NoContent();
    }
}

public record UpdateProfileRequest(string Name, string? Bio, string? AvatarKey);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
