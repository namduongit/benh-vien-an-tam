using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace api.Contract;

public sealed class ApiResponse<T>
{
    public bool Success { get; }
    public int StatusCode { get; }
    public string Message { get; }
    public object? Errors { get; }
    public T? Data { get; }

    private ApiResponse(int statusCode, string message, T? data, object? errors)
    {
        Success = statusCode < StatusCodes.Status400BadRequest;
        StatusCode = statusCode;
        Message = message;
        Data = data;
        Errors = errors;
    }

    public static ObjectResult RequestSuccess(
        T? data,
        string message = "Request successfully completed") =>
        CreateResult(StatusCodes.Status200OK, message, data);

    public static ObjectResult CreatedSuccess(
        T? data,
        string message = "Resource created successfully") =>
        CreateResult(StatusCodes.Status201Created, message, data);

    public static ObjectResult BadRequest(
        object? errors = null,
        string message = "Bad request") =>
        CreateResult(StatusCodes.Status400BadRequest, message, errors: errors);

    public static ObjectResult Unauthorized(
        string message = "Unauthorized") =>
        CreateResult(StatusCodes.Status401Unauthorized, message);

    public static ObjectResult Forbidden(
        string message = "Forbidden") =>
        CreateResult(StatusCodes.Status403Forbidden, message);

    public static ObjectResult NotFound(
        string message = "Resource not found") =>
        CreateResult(StatusCodes.Status404NotFound, message);

    public static ObjectResult Conflict(
        object? errors = null,
        string message = "Conflict") =>
        CreateResult(StatusCodes.Status409Conflict, message, errors: errors);

    public static ObjectResult InternalServerError(
        string message = "An unexpected error occurred") =>
        CreateResult(StatusCodes.Status500InternalServerError, message);

    private static ObjectResult CreateResult(
        int statusCode,
        string message,
        T? data = default,
        object? errors = null) =>
        new(new ApiResponse<T>(statusCode, message, data, errors))
        {
            StatusCode = statusCode
        };
}
