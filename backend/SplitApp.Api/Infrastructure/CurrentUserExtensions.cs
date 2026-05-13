using System.Security.Claims;

namespace SplitApp.Api.Infrastructure;

public static class CurrentUserExtensions
{
    public static Guid GetCurrentUserId(this ClaimsPrincipal user)
    {
        var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
    }
}
