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
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("api/groups/{groupId}/payments")]
    public async Task<IActionResult> GetGroupPayments(Guid groupId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            var normalizedSkip = Math.Max(0, skip);
            var normalizedTake = Math.Clamp(take, 1, 100);
            return Ok(await _mediator.Send(new GetGroupPaymentsQuery(groupId, userId, normalizedSkip, normalizedTake)));
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("api/groups/{groupId}/payments")]
    public async Task<IActionResult> RecordPayment(Guid groupId, [FromBody] RecordGroupPaymentRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            return Ok(await _mediator.Send(new RecordGroupPaymentCommand(
                groupId,
                userId,
                request.FromUserId,
                request.ToUserId,
                request.Amount,
                request.Currency,
                request.Note)));
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("api/payments/{id}/void")]
    public async Task<IActionResult> VoidPayment(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        try
        {
            await _mediator.Send(new VoidGroupPaymentCommand(id, userId));
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status404NotFound);
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }
}

public record RecordGroupPaymentRequest(Guid FromUserId, Guid ToUserId, decimal Amount, string Currency, string? Note);
