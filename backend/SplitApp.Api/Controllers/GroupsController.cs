using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Infrastructure;
using SplitApp.Application.Commands;
using SplitApp.Application.Queries;

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

    [HttpPost]
    public async Task<IActionResult> CreateGroup([FromBody] CreateGroupRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var groupId = await _mediator.Send(new CreateGroupCommand(request.Name, request.DefaultCurrency, userId));
        return Ok(new { Id = groupId });
    }

    [HttpGet]
    public async Task<IActionResult> GetUserGroups()
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        return Ok(await _mediator.Send(new GetUserGroupsQuery(userId)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupDetails(Guid id)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var group = await _mediator.Send(new GetGroupDetailsQuery(id, userId));
        return group is null ? ApiProblemDetails.Result("group.notFound", StatusCodes.Status404NotFound) : Ok(group);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        return Ok(await _mediator.Send(new UpdateGroupCommand(
            id,
            userId,
            request.Name,
            request.Description,
            request.AvatarKey,
            request.DefaultCurrency)));
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinGroup([FromRoute] Guid id)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var success = await _mediator.Send(new JoinGroupCommand(id, userId));
        return success ? Ok() : ApiProblemDetails.Result("group.notFound", StatusCodes.Status404NotFound);
    }

    [HttpGet("{id}/activity")]
    public async Task<IActionResult> GetGroupActivity(Guid id, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var normalizedSkip = Math.Max(0, skip);
        var normalizedTake = Math.Clamp(take, 1, 100);
        return Ok(await _mediator.Send(new GetGroupActivityQuery(id, userId, normalizedSkip, normalizedTake)));
    }

    [HttpGet("{id}/members")]
    public async Task<IActionResult> GetGroupMembers(Guid id)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        return Ok(await _mediator.Send(new GetGroupMembersQuery(id, userId)));
    }

    [HttpPut("{id}/members/{userId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid userId, [FromBody] UpdateGroupMemberRoleRequest request)
    {
        var actingUserId = User.GetCurrentUserId();
        if (actingUserId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var success = await _mediator.Send(new UpdateGroupMemberRoleCommand(id, actingUserId, userId, request.Role));
        return success ? Ok() : ApiProblemDetails.Result("group.memberNotFound", StatusCodes.Status404NotFound);
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveGroupMember(Guid id, Guid userId)
    {
        var actingUserId = User.GetCurrentUserId();
        if (actingUserId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var success = await _mediator.Send(new RemoveGroupMemberCommand(id, actingUserId, userId));
        return success ? Ok() : ApiProblemDetails.Result("group.memberNotFound", StatusCodes.Status404NotFound);
    }
}

public record CreateGroupRequest(string Name, string DefaultCurrency);
public record UpdateGroupRequest(string Name, string? Description, string? AvatarKey, string DefaultCurrency);
public record UpdateGroupMemberRoleRequest(int Role);
