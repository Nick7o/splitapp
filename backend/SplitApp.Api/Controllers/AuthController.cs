using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Localization;
using SplitApp.Application.Commands;
using System.Threading.Tasks;
using System;

namespace SplitApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        try
        {
            var command = new AuthenticateGoogleUserCommand(request.Credential);
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (System.UnauthorizedAccessException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status401Unauthorized);
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var command = new RegisterUserCommand(request.Email, request.Password, request.Name);
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var command = new LoginUserCommand(request.Email, request.Password);
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (System.UnauthorizedAccessException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status401Unauthorized);
        }
    }
}

public record GoogleLoginRequest(string Credential);
public record RegisterRequest(string Email, string Password, string Name);
public record LoginRequest(string Email, string Password);
