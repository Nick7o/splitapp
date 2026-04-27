using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SplitApp.Api.Localization;
using SplitApp.Application.Commands;
using SplitApp.Application.DTOs;
using SplitApp.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

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

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound();

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
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            return Ok(await _mediator.Send(new UpdateProfileCommand(userId, request.Name, request.Bio, request.AvatarKey)));
        }
        catch (KeyNotFoundException)
        {
            return ErrorMessages.ToResult(HttpContext, "user.notFound", StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            await _mediator.Send(new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword));
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return ErrorMessages.ToResult(HttpContext, "user.notFound", StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }
}

public record UpdateProfileRequest(string Name, string? Bio, string? AvatarKey);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
