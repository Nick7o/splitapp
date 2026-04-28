using Microsoft.AspNetCore.Mvc;

namespace SplitApp.Api.Infrastructure;

public static class ApiProblemDetails
{
    public static ProblemDetails Create(string code, int statusCode)
    {
        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode >= 500 ? "Server error" : "Request error",
            Detail = code
        };
        problem.Extensions["code"] = code;

        return problem;
    }

    public static ObjectResult Result(string code, int statusCode)
    {
        var problem = Create(code, statusCode);

        return new ObjectResult(problem)
        {
            StatusCode = statusCode,
            ContentTypes = { "application/problem+json" }
        };
    }
}
