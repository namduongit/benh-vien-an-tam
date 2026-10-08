using api.Contract;
using api.Contract.Auth;
using api.Service;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);

        return ApiResponse<RegisterResult>.CreatedSuccess(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);

        AppendTokenCookie("access_token", result.AccessToken, result.AccessExpiresAt);
        AppendTokenCookie("refresh_token", result.RefreshToken, result.RefreshExpiresAt);

        return ApiResponse<AuthSessionResult>.RequestSuccess(
            result.Session,
            "Đăng nhập thành công.");
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
        {
            return ApiResponse<object>.Unauthorized("Không tìm thấy refresh token.");
        }

        var result = await authService.RefreshAsync(refreshToken, cancellationToken);

        AppendTokenCookie("access_token", result.AccessToken, result.AccessExpiresAt);
        AppendTokenCookie("refresh_token", result.RefreshToken, result.RefreshExpiresAt);

        return ApiResponse<AuthSessionResult>.RequestSuccess(
            result.Session,
            "Làm mới phiên đăng nhập thành công.");
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        ClearTokenCookie("access_token");
        ClearTokenCookie("refresh_token");

        return ApiResponse<object>.RequestSuccess(null, "Đăng xuất thành công.");
    }

    private void AppendTokenCookie(string name, string value, DateTimeOffset expiresAt)
    {
        Response.Cookies.Append(name, value, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt,
            Path = "/"
        });
    }

    private void ClearTokenCookie(string name)
    {
        Response.Cookies.Delete(name, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });
    }
}
