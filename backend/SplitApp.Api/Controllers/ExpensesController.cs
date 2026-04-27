using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Localization;
using SplitApp.Application.Queries;
using SplitApp.Application.Commands;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SplitApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ExpensesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(Guid id)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var query = new GetExpenseQuery(id, userId);
        var expense = await _mediator.Send(query);

        if (expense == null) return NotFound();

        return Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var payerId = request.PayerId ?? userId;

        var command = new CreateExpenseCommand(
            request.GroupId,
            payerId,
            request.Title,
            request.TotalAmount,
            request.Currency,
            request.Splits,
            request.SplitMethod,
            request.IsSettlement);

        try
        {
            var expenseId = await _mediator.Send(command);
            return Ok(new { Id = expenseId });
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] CreateExpenseRequest request)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var payerId = request.PayerId ?? userId;

        var command = new UpdateExpenseCommand(
            id,
            request.GroupId,
            payerId,
            request.Title,
            request.TotalAmount,
            request.Currency,
            request.Splits,
            userId,
            request.SplitMethod);

        try
        {
            var success = await _mediator.Send(command);
            if (!success) return NotFound();
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return ErrorMessages.ToResult(HttpContext, ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(Guid id, [FromQuery] Guid groupId)
    {
        var userId = GetUserId();
        if (userId == Guid.Empty) return Unauthorized();

        var command = new DeleteExpenseCommand(id, groupId, userId);
        var success = await _mediator.Send(command);

        if (!success) return NotFound();

        return Ok();
    }
}

    public record CreateExpenseRequest(
        Guid GroupId,
        Guid? PayerId,
        string Title,
        decimal TotalAmount,
        string Currency,
        List<ExpenseSplitDto> Splits,
        string SplitMethod = "equally",
        bool IsSettlement = false);
