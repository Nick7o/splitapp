using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SplitApp.Api.Infrastructure;
using System.Security.Claims;

namespace SplitApp.Tests.Api;

public class ProblemDetailsTests
{
    [Fact]
    public void ApiProblemDetails_always_contains_stable_code_extension()
    {
        var result = ApiProblemDetails.Result("group.notFound", StatusCodes.Status404NotFound);

        var problem = Assert.IsType<ProblemDetails>(result.Value);
        Assert.Equal(StatusCodes.Status404NotFound, result.StatusCode);
        Assert.Equal("application/problem+json", result.ContentTypes.Single());
        Assert.Equal("group.notFound", problem.Detail);
        Assert.Equal("group.notFound", problem.Extensions["code"]);
    }

    [Fact]
    public void CurrentUserExtensions_reads_name_identifier_claim()
    {
        var userId = Guid.NewGuid();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }));

        Assert.Equal(userId, principal.GetCurrentUserId());
    }

    [Fact]
    public void CurrentUserExtensions_returns_empty_guid_for_missing_or_invalid_claim()
    {
        Assert.Equal(Guid.Empty, new ClaimsPrincipal().GetCurrentUserId());

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "not-a-guid")
        }));

        Assert.Equal(Guid.Empty, principal.GetCurrentUserId());
    }
}
