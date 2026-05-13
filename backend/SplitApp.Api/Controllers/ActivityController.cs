using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Infrastructure;
using SplitApp.Application.Queries;

namespace SplitApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivityController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserActivityLogDto>>> Get([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var normalizedSkip = Math.Max(skip, 0);
        var normalizedTake = Math.Clamp(take, 1, 200);

        return await _mediator.Send(new GetUserActivityQuery(userId, normalizedSkip, normalizedTake));
    }
}
