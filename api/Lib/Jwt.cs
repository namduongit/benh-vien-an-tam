using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.Lib.Setting;
using api.Lib.Type;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace api.Lib;

public sealed class Jwt(IOptions<JwtSetting> options)
{
    private readonly JwtSetting _setting = options.Value;

    public string CreateAccessToken(AccessTokenPayload payload)
    {
        var issuedAt = DateTime.UtcNow;
        var expiresAt = issuedAt.AddMinutes(_setting.AccessTokenMinutes);
        var claims = CreateAccessClaims(payload, issuedAt);

        return CreateToken(claims, issuedAt, expiresAt);
    }

    public string CreateRefreshToken(RefreshTokenPayload payload)
    {
        var issuedAt = DateTime.UtcNow;
        var expiresAt = issuedAt.AddDays(_setting.RefreshTokenDays);
        var claims = CreateRefreshClaims(payload, issuedAt);

        return CreateToken(claims, issuedAt, expiresAt);
    }

    public ClaimsPrincipal? ValidateAccessToken(string token)
    {
        return ValidateToken(token, "access");
    }

    public ClaimsPrincipal? ValidateRefreshToken(string token)
    {
        return ValidateToken(token, "refresh");
    }

    private string CreateToken(
        IEnumerable<Claim> claims,
        DateTime issuedAt,
        DateTime expiresAt)
    {
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_setting.SecretKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: null,
            audience: null,
            claims: claims,
            notBefore: issuedAt,
            expires: expiresAt,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token, string expectedTokenType)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        try
        {
            var principal = new JwtSecurityTokenHandler().ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(_setting.SecretKey)),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256]
                },
                out _);

            return principal.FindFirstValue("token_type") == expectedTokenType
                ? principal
                : null;
        }
        catch (Exception exception) when (
            exception is SecurityTokenException or ArgumentException)
        {
            return null;
        }
    }

    private static IEnumerable<Claim> CreateAccessClaims(
        AccessTokenPayload payload,
        DateTime issuedAt)
    {
        List<Claim> claims =
        [
            new Claim("uuid", payload.Uuid.ToString()),
            new Claim("role", payload.Role),
            new Claim("token_type", "access"),
            CreateIssuedAtClaim(issuedAt)
        ];

        claims.AddRange(payload.Permissions.Select(permission =>
            new Claim("permission", permission)));

        return claims;
    }

    private static IEnumerable<Claim> CreateRefreshClaims(
        RefreshTokenPayload payload,
        DateTime issuedAt)
    {
        return
        [
            new Claim("uuid", payload.Uuid.ToString()),
            new Claim("token_type", "refresh"),
            CreateIssuedAtClaim(issuedAt)
        ];
    }

    private static Claim CreateIssuedAtClaim(DateTime issuedAt)
    {
        var unixTime = new DateTimeOffset(issuedAt).ToUnixTimeSeconds();

        return new Claim(
            JwtRegisteredClaimNames.Iat,
            unixTime.ToString(),
            ClaimValueTypes.Integer64);
    }
}
