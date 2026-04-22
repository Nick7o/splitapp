using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Application.Commands;
using SplitApp.Application.Queries;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SplitApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IMediator _mediator;

    public GroupsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }

    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var command = new CreateGroupCommand(request.Name, request.Currency, userId);
        var groupId = await _mediator.Send(command);

        return Ok(new { Id = groupId });
    }

    [HttpGet]
    public async Task<IActionResult> GetUserGroups()
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = new GetUserGroupsQuery(userId);
        var groups = await _mediator.Send(query);

        return Ok(groups);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupDetails(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = new GetGroupDetailsQuery(id, userId);
        var group = await _mediator.Send(query);

        if (group == null) return NotFound();

        return Ok(group);
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinGroup([FromRoute] Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var command = new JoinGroupCommand(id, userId);
        var success = await _mediator.Send(command);

        if (!success) return NotFound(new { Error = $"Group with ID {id} not found." });

        return Ok();
    }

    [HttpGet("{id}/activity")]
    public async Task<IActionResult> GetGroupActivity(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = new GetGroupActivityQuery(id, userId);
        var logs = await _mediator.Send(query);

        return Ok(logs);
    }
}

public record CreateGroupRequest(string Name, string Currency);
