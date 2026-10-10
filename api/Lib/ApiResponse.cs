using System.Text.Json.Serialization;

namespace api.Lib;

public class ApiResponse<T>
{
    [JsonPropertyName("Success")]
    public bool IsSuccess { get; set; }

    public string Message { get; set; } = string.Empty;

    public T? Data { get; set; }

    public int StatusCode { get; set; }

    public static ApiResponse<T> Success(T data, string message = "Thành công")
    {
        return new ApiResponse<T>
        {
            IsSuccess = true,
            Message = message,
            Data = data,
            StatusCode = 200
        };
    }

    public static ApiResponse<T> Fail(string message, int statusCode = 400)
    {
        return new ApiResponse<T>
        {
            IsSuccess = false,
            Message = message,
            Data = default,
            StatusCode = statusCode
        };
    }
}