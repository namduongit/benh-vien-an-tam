using System.Security.Claims;
using System.Text.Json.Serialization;
using api.Contract;
using api.Contract.Auth;
using api.Lib;
using api.Lib.Setting;
using api.Lib.Type;
using api.Model;
using api.Model.Enum;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace api.Service;

public sealed class AuthService(
    DBContext dbContext,
    PasswordHasher passwordHasher,
    Jwt jwt,
    IOptions<JwtSetting> jwtOptions
)
{
    private readonly JwtSetting _jwtSetting = jwtOptions.Value;

    public async Task<RegisterResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.Phone);
        var email = request.Email.Trim().ToLowerInvariant();
        var errors = new Dictionary<string, string[]>();

        if (await dbContext.Accounts.AnyAsync(account => account.Phone == phone, cancellationToken))
        {
            errors[nameof(request.Phone)] = ["Số điện thoại đã được sử dụng"];
        }

        if (await dbContext.PatientProfiles.AnyAsync(profile => profile.Email == email, cancellationToken))
        {
            errors[nameof(request.Email)] = ["Email đã được sử dụng"];
        }

        if (errors.Count > 0)
        {
            throw new DuplicateException(errors);
        }

        var now = DateTime.UtcNow;
        var accountUuid = Guid.NewGuid();
        var profileUuid = Guid.NewGuid();
        var account = new Account
        {
            Uuid = accountUuid,
            Phone = phone,
            Password = passwordHasher.Hash(request.Password),
            RoleUuid = null,
            Status = BaseStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        };
        var profile = new PatientProfile
        {
            Uuid = profileUuid,
            AccountUuid = accountUuid,
            Name = request.Name.Trim(),
            Gender = request.Gender,
            Birthdate = request.Birthdate!.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            MedicalCode = "",
            Email = email
        };

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        dbContext.Accounts.Add(account);
        dbContext.PatientProfiles.Add(profile);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw new AppException();
        }

        return new RegisterResult(accountUuid, profileUuid, email);
    }

    public async Task<LoginResult> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.Phone);
        var account = await dbContext.Accounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Phone == phone, cancellationToken);

        if (account is null)
        {
            throw new AppException(401, "Tài khoản không tồn tại");
        }

        if (account.Status != BaseStatus.Active)
        {
            throw new AppException(401, "Tài khoản đã bị khóa");
        }

        if (!passwordHasher.Verify(request.Password, account.Password))
        {
            throw new AppException(401, "Mật khẩu không chính xác");
        }

        var profile = await FindProfileAsync(account.Uuid, cancellationToken);

        return await CreateLoginResultAsync(account, profile, cancellationToken);
    }

    public async Task<LoginResult> RefreshAsync(string refreshToken, CancellationToken cancellationToken)
    {
        var principal = jwt.ValidateRefreshToken(refreshToken);
        if (principal is null)
        {
            throw new AppException(401, "Refresh token không hợp lệ hoặc đã hết hạn.");
        }

        if (!Guid.TryParse(principal.FindFirstValue("uuid"), out var accountUuid))
        {
            throw new AppException(401, "Token không hợp lệ.");
        }

        var account = await dbContext.Accounts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Uuid == accountUuid, cancellationToken);
        if (account is null || account.DeletedAt.HasValue || account.Status != BaseStatus.Active)
        {
            throw new AppException(401, "Phiên đăng nhập không còn hợp lệ.");
        }

        var profile = await FindProfileAsync(account.Uuid, cancellationToken);

        return await CreateLoginResultAsync(account, profile, cancellationToken);
    }

    private async Task<AuthProfileResult> FindProfileAsync(
        Guid accountUuid,
        CancellationToken cancellationToken)
    {
        var patientProfile = await dbContext.PatientProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(
                profile => profile.AccountUuid == accountUuid,
                cancellationToken);

        if (patientProfile is not null)
        {
            return new AuthPatientProfileResult(
                patientProfile.Uuid,
                patientProfile.AccountUuid!.Value,
                patientProfile.Avatar,
                patientProfile.Name,
                patientProfile.Gender,
                patientProfile.Birthdate,
                patientProfile.MedicalCode,
                patientProfile.Email);
        }

        var doctorProfile = await dbContext.DoctorProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(
                profile => profile.AccountUuid == accountUuid,
                cancellationToken);

        if (doctorProfile is not null)
        {
            return new AuthDoctorProfileResult(
                doctorProfile.Uuid,
                doctorProfile.AccountUuid!.Value,
                doctorProfile.Avatar,
                doctorProfile.Slug,
                doctorProfile.Name,
                doctorProfile.Price,
                doctorProfile.DepartmentDisplay,
                doctorProfile.Introduction,
                doctorProfile.Expertise,
                doctorProfile.Specialty,
                doctorProfile.Workplace,
                doctorProfile.IsFeatured,
                doctorProfile.HospitalUuid,
                doctorProfile.CreatedAt,
                doctorProfile.UpdatedAt,
                doctorProfile.DeletedAt);
        }

        throw new AppException(401, "Không tìm thấy hồ sơ của tài khoản.");
    }

    private async Task<LoginResult> CreateLoginResultAsync(
        Account account,
        AuthProfileResult profile,
        CancellationToken cancellationToken)
    {
        var role = account.RoleUuid.HasValue
            ? await dbContext.Roles
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    item => item.Uuid == account.RoleUuid.Value,
                    cancellationToken)
            : null;

        var permissions = new HashSet<string>();
        if (role is not null)
        {
            var assignedPermissions = await (
                from rolePermission in dbContext.RolePermissions.AsNoTracking()
                join permission in dbContext.Permissions.AsNoTracking()
                    on rolePermission.PermissionUuid equals permission.Uuid
                where rolePermission.RoleUuid == role.Uuid
                select new { permission.Name, rolePermission.Action })
                .ToListAsync(cancellationToken);

            foreach (var permission in assignedPermissions)
            {
                permissions.Add(
                    $"{permission.Name}:{permission.Action.ToString().ToLowerInvariant()}");
            }
        }

        var issuedAt = DateTimeOffset.UtcNow;
        var accessExpiresAt = issuedAt.AddMinutes(_jwtSetting.AccessTokenMinutes);
        var refreshExpiresAt = issuedAt.AddDays(_jwtSetting.RefreshTokenDays);

        var accessToken = jwt.CreateAccessToken(new AccessTokenPayload(
            account.Uuid,
            role?.Name ?? "patient",
            permissions));
        var refreshToken = jwt.CreateRefreshToken(new RefreshTokenPayload(account.Uuid));

        return new LoginResult(
            new AuthSessionResult(
                new AuthAccountResult(
                    account.Uuid,
                    account.Phone,
                    account.RoleUuid,
                    account.Status,
                    account.HospitalUuid,
                    account.CreatedAt,
                    account.UpdatedAt,
                    account.DeletedAt),
                profile),
            issuedAt,
            accessExpiresAt,
            refreshExpiresAt,
            accessToken,
            refreshToken);
    }

    private static string NormalizePhone(string phone)
    {
        var normalized = phone.Trim();
        return normalized.StartsWith("+84", StringComparison.Ordinal)
            ? $"0{normalized[3..]}"
            : normalized;
    }
}

public sealed record RegisterResult(
    Guid? AccountUuid,
    Guid? PatientProfileUuid,
    string? Email
);

public sealed record LoginResult(
    AuthSessionResult Session,
    DateTimeOffset IssuedAt,
    DateTimeOffset AccessExpiresAt,
    DateTimeOffset RefreshExpiresAt,
    string AccessToken,
    string RefreshToken
);

public sealed record AuthSessionResult(
    AuthAccountResult Account,
    AuthProfileResult Profile
);

public sealed record AuthAccountResult(
    Guid Uuid,
    string Phone,
    Guid? RoleUuid,
    BaseStatus Status,
    Guid? HospitalUuid,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt
);

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(AuthPatientProfileResult), "patient")]
[JsonDerivedType(typeof(AuthDoctorProfileResult), "doctor")]
public abstract record AuthProfileResult;

public sealed record AuthPatientProfileResult(
    Guid Uuid,
    Guid AccountUuid,
    string Avatar,
    string Name,
    Gender Gender,
    DateTime Birthdate,
    string MedicalCode,
    string Email
) : AuthProfileResult;

public sealed record AuthDoctorProfileResult(
    Guid Uuid,
    Guid AccountUuid,
    string Avatar,
    string Slug,
    string Name,
    int Price,
    string DepartmentDisplay,
    string Introduction,
    string Expertise,
    string Specialty,
    string Workplace,
    bool IsFeatured,
    Guid? HospitalUuid,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt
) : AuthProfileResult;
