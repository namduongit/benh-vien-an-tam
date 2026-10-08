using api.Contract;
namespace api.Middleware;

public class ExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandler> _logger;

    public ExceptionHandler(RequestDelegate next, ILogger<ExceptionHandler> logger)
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message;
        object errors;

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            message = appException.Message;
            errors = appException.Errors;
        }
        else
        {
            statusCode = 500;
            message = "An unexpected error occurred";
            errors = exception.Message;
        }

        context.Response.StatusCode = statusCode;

        var response = new
        {
            Success = false,
            StatusCode = statusCode,
            Message = message,
            Errors = errors,
            Data = (object?)null,
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}