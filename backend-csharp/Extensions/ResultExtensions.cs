using FluentResults;
using Microsoft.AspNetCore.Mvc;

namespace LmsApi.Extensions;

// Carries the HTTP status code a service-layer failure should surface as,
// alongside the `{ message }` body shape used throughout the API.
public class HttpError : Error
{
    public int StatusCode { get; }

    public HttpError(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}

public static class ResultExtensions
{
    public static IActionResult ToActionResult(this ControllerBase controller, Result result, int successStatusCode = StatusCodes.Status204NoContent)
    {
        return result.IsFailed ? Fail(controller, result) : controller.StatusCode(successStatusCode);
    }

    public static IActionResult ToActionResult<T>(this ControllerBase controller, Result<T> result, int successStatusCode = StatusCodes.Status200OK)
    {
        return result.IsFailed ? Fail(controller, result) : controller.StatusCode(successStatusCode, result.Value);
    }

    private static IActionResult Fail(ControllerBase controller, ResultBase result)
    {
        var error = result.Errors.OfType<HttpError>().FirstOrDefault();
        var statusCode = error?.StatusCode ?? StatusCodes.Status500InternalServerError;
        var message = error?.Message ?? result.Errors.FirstOrDefault()?.Message ?? "Unexpected error";
        return controller.StatusCode(statusCode, new { message });
    }
}
