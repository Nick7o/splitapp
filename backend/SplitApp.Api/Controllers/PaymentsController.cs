using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Infrastructure;
using SplitApp.Application.Commands;
using SplitApp.Application.Queries;

namespace SplitApp.Api.Controllers;

[ApiController]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("api/groups/{groupId}/payments")]
    public async Task<IActionResult> GetGroupPayments(Guid groupId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var normalizedSkip = Math.Max(0, skip);
        var normalizedTake = Math.Clamp(take, 1, 100);
        return Ok(await _mediator.Send(new GetGroupPaymentsQuery(groupId, userId, normalizedSkip, normalizedTake)));
    }

    [HttpPost("api/groups/{groupId}/payments")]
    public async Task<IActionResult> RecordPayment(Guid groupId, [FromBody] RecordGroupPaymentRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        return Ok(await _mediator.Send(new RecordGroupPaymentCommand(
            groupId,
            userId,
            request.FromUserId,
            request.ToUserId,
            request.Amount,
            request.Currency,
            request.Note)));
    }

    [HttpPost("api/payments/{id}/void")]
    public async Task<IActionResult> VoidPayment(Guid id)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        await _mediator.Send(new VoidGroupPaymentCommand(id, userId));
        return NoContent();
    }
}

public record RecordGroupPaymentRequest(Guid FromUserId, Guid ToUserId, decimal Amount, string Currency, string? Note);
