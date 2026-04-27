using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Localization;
using SplitApp.Application.Commands;
using SplitApp.Application.Queries;
using System;
using System.Collections.Generic;
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

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var dto = await _mediator.Send(new UpdateGroupCommand(id, userId, request.Name, request.Description, request.AvatarKey, request.Currency));
            return Ok(dto);
        }
        catch (KeyNotFoundException)
        {
            return ErrorMessages.ToResult(HttpContext, "group.notFound", StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinGroup([FromRoute] Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var command = new JoinGroupCommand(id, userId);
        var success = await _mediator.Send(command);

        if (!success) return ErrorMessages.ToResult(HttpContext, "group.notFound", StatusCodes.Status404NotFound);

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

    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetGroupMembers(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = new GetGroupMembersQuery(id, userId);
        var members = await _mediator.Send(query);

        return Ok(members);
    }

    [HttpPut("{id}/members/{userId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid userId, [FromBody] UpdateGroupMemberRoleRequest request)
    {
        var actingUserId = GetUserId();
        if (actingUserId == Guid.Empty) return Unauthorized();

        try
        {
            var success = await _mediator.Send(new UpdateGroupMemberRoleCommand(id, actingUserId, userId, request.Role));
            if (!success) return NotFound();
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return ErrorMessages.ToResult(HttpContext, "group.notFound", StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveGroupMember(Guid id, Guid userId)
    {
        var actingUserId = GetUserId();
        if (actingUserId == Guid.Empty) return Unauthorized();

        try
        {
            var success = await _mediator.Send(new RemoveGroupMemberCommand(id, actingUserId, userId));
            if (!success) return NotFound();
            return Ok();
        }
        catch (KeyNotFoundException)
        {
            return ErrorMessages.ToResult(HttpContext, "group.notFound", StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }
}

public record CreateGroupRequest(string Name, string Currency);
public record UpdateGroupRequest(string Name, string? Description, string? AvatarKey, string Currency);
public record UpdateGroupMemberRoleRequest(int Role);
