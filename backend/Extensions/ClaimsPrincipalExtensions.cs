using System.Security.Claims;

namespace LmsApi.Extensions;

public static class ClaimsPrincipalExtensions
{
    // Mirrors `req.user!.id` from the Express middleware's decoded JWT payload.
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("id");
        return int.Parse(value!);
    }
}
