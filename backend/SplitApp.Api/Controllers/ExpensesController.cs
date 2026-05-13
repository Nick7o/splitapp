using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Infrastructure;
using SplitApp.Application.Queries;
using SplitApp.Application.Commands;

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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(Guid id)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var query = new GetExpenseQuery(id, userId);
        var expense = await _mediator.Send(query);

        if (expense == null) return ApiProblemDetails.Result("expense.notFound", StatusCodes.Status404NotFound);

        return Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var payerId = request.PayerId ?? userId;

        var command = new CreateExpenseCommand(
            request.GroupId,
            payerId,
            userId,
            request.Title,
            request.TotalAmount,
            request.Currency,
            request.Splits,
            request.SplitMethod);

        var expenseId = await _mediator.Send(command);
        return Ok(new { Id = expenseId });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] CreateExpenseRequest request)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

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

        var success = await _mediator.Send(command);
        return success ? Ok() : ApiProblemDetails.Result("expense.notFound", StatusCodes.Status404NotFound);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(Guid id, [FromQuery] Guid groupId)
    {
        var userId = User.GetCurrentUserId();
        if (userId == Guid.Empty) return ApiProblemDetails.Result("auth.unauthorized", StatusCodes.Status401Unauthorized);

        var command = new DeleteExpenseCommand(id, groupId, userId);
        var success = await _mediator.Send(command);

        if (!success) return ApiProblemDetails.Result("expense.notFound", StatusCodes.Status404NotFound);

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
        string SplitMethod = "equally");
