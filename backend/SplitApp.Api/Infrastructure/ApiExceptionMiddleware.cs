using System.Net;

namespace SplitApp.Api.Infrastructure;

public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteProblem(context, ex.Message, StatusCodes.Status404NotFound);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteProblem(context, ex.Message, StatusCodes.Status401Unauthorized);
        }
        catch (ArgumentException ex)
        {
            await WriteProblem(context, ex.Message, StatusCodes.Status400BadRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled API exception while processing {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteProblem(context, "internal_error", StatusCodes.Status500InternalServerError);
        }
    }

    private static async Task WriteProblem(HttpContext context, string code, int statusCode)
    {
        if (context.Response.HasStarted)
        {
            throw new InvalidOperationException("Cannot write problem details after response has started.");
        }

        var result = ApiProblemDetails.Result(NormalizeCode(code), statusCode);
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(result.Value);
    }

    private static string NormalizeCode(string value)
    {
        if (value.Contains('.', StringComparison.Ordinal))
        {
            return value;
        }

        return value switch
        {
            "Invalid email or password." => "auth.invalidCredentials",
            "Invalid Google token." => "auth.invalidGoogleToken",
            "User with this email already exists." => "auth.emailExists",
            "Currency is required" => "currency.required",
            "Sum of splits must equal total amount" => "expense.splitSumMismatch",
            var text when text.StartsWith("Unsupported currency code", StringComparison.Ordinal) => "currency.unsupported",
            var text when text.StartsWith("Group with ID", StringComparison.Ordinal) => "group.notFound",
            _ => value
        };
    }
}
