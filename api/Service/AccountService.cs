using api.Config;
using api.Contract.Account;
using api.Lib;
using api.Model;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public sealed class AccountService(
    DBContext dbContext,
    PasswordHasher passwordHasher)
{
    public async Task<IReadOnlyList<AccountResponse>> GetAccountsAsync(
        CancellationToken cancellationToken)
    {
        var accounts = await dbContext.Accounts
            .AsNoTracking()
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync(cancellationToken);
        return await MapAccountsAsync(accounts, cancellationToken);
    }

    public async Task<AccountResponse?> GetAccountByIdAsync(
        Guid uuid,
        CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Uuid == uuid, cancellationToken);
        if (account is null) return null;

        return (await MapAccountsAsync([account], cancellationToken)).Single();
    }

    public async Task<AccountOptionsResponse> GetOptionsAsync(CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .AsNoTracking()
            .Where(item => item.DeletedAt == null)
            .OrderBy(item => item.Name)
            .Select(item => new AccountRoleOptionResponse(item.Uuid, item.Name, item.IsDoctor))
            .ToListAsync(cancellationToken);
        var hospitals = await dbContext.Hospitals
            .AsNoTracking()
            .Where(item => item.DeletedAt == null)
            .OrderBy(item => item.Name)
            .Select(item => new AccountHospitalOptionResponse(item.Uuid, item.Name))
            .ToListAsync(cancellationToken);

        return new AccountOptionsResponse { Roles = roles, Hospitals = hospitals };
    }

    public async Task<AccountResponse> CreateAccountAsync(
        CreateAccountRequest request,
        CancellationToken cancellationToken)
    {
        var phone = NormalizePhone(request.Phone);
        await EnsurePhoneAvailableAsync(phone, null, cancellationToken);
        var role = await ValidateReferencesAsync(request.RoleUuid, request.HospitalUuid, cancellationToken);
        var name = request.Name.Trim();

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Ho va ten la bat buoc");
        }

        if (role.IsDoctor && string.IsNullOrWhiteSpace(request.Slug))
        {
            throw new InvalidOperationException("Slug bac si la bat buoc");
        }

        var slug = request.Slug?.Trim();
        if (role.IsDoctor && await dbContext.DoctorProfiles.AnyAsync(
                profile => profile.Slug == slug,
                cancellationToken))
        {
            throw new InvalidOperationException("Slug bac si da ton tai");
        }

        if (!role.IsDoctor &&
            (!request.Gender.HasValue || !request.Birthdate.HasValue || string.IsNullOrWhiteSpace(request.Email)))
        {
            throw new InvalidOperationException("Gioi tinh, ngay sinh va email benh nhan la bat buoc");
        }

        if (!role.IsDoctor && request.Birthdate!.Value >= DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidOperationException("Ngay sinh phai truoc ngay hien tai");
        }

        var email = request.Email?.Trim().ToLowerInvariant();
        if (!role.IsDoctor && await dbContext.PatientProfiles.AnyAsync(
                profile => profile.Email == email,
                cancellationToken))
        {
            throw new InvalidOperationException("Email da duoc su dung");
        }

        var now = DateTime.UtcNow;
        var account = new Account
        {
            Uuid = Guid.NewGuid(),
            Phone = phone,
            Password = passwordHasher.Hash(request.Password),
            RoleUuid = request.RoleUuid,
            HospitalUuid = request.HospitalUuid,
            Status = request.Status,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Accounts.Add(account);

        var profileUuid = Guid.NewGuid();
        if (role.IsDoctor)
        {
            dbContext.DoctorProfiles.Add(new DoctorProfile
            {
                Uuid = profileUuid,
                AccountUuid = account.Uuid,
                HospitalUuid = account.HospitalUuid,
                Name = name,
                Slug = slug!,
                Avatar = request.Avatar?.Trim() ?? string.Empty,
                Price = request.Price ?? 0,
                DepartmentDisplay = request.DepartmentDisplay?.Trim() ?? string.Empty,
                Introduction = request.Introduction?.Trim() ?? string.Empty,
                Expertise = request.Expertise?.Trim() ?? string.Empty,
                Specialty = request.Specialty?.Trim() ?? string.Empty,
                Workplace = request.Workplace?.Trim() ?? string.Empty,
                IsFeatured = request.IsFeatured,
            });
        }
        else
        {
            dbContext.PatientProfiles.Add(new PatientProfile
            {
                Uuid = profileUuid,
                AccountUuid = account.Uuid,
                Name = name,
                Gender = request.Gender!.Value,
                Birthdate = request.Birthdate!.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
                Avatar = request.Avatar?.Trim() ?? string.Empty,
                MedicalCode = string.IsNullOrWhiteSpace(request.MedicalCode)
                    ? string.Empty
                    : request.MedicalCode.Trim(),
                Email = email!,
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return (await MapAccountsAsync([account], cancellationToken)).Single();
    }

    public async Task<AccountResponse?> UpdateAccountAsync(
        Guid uuid,
        UpdateAccountRequest request,
        CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (account is null) return null;

        var phone = NormalizePhone(request.Phone);
        await EnsurePhoneAvailableAsync(phone, uuid, cancellationToken);
        if (request.RoleUuid != account.RoleUuid)
        {
            throw new InvalidOperationException("Khong the thay doi role cua tai khoan da tao");
        }
        var role = await ValidateReferencesAsync(request.RoleUuid, request.HospitalUuid, cancellationToken);
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new InvalidOperationException("Ho va ten la bat buoc");
        }

        DoctorProfile? doctorProfile = null;
        PatientProfile? patientProfile = null;
        if (role.IsDoctor)
        {
            doctorProfile = await dbContext.DoctorProfiles.FirstOrDefaultAsync(
                item => item.AccountUuid == uuid,
                cancellationToken);
            if (doctorProfile is null)
            {
                throw new InvalidOperationException("Khong tim thay ho so bac si cua tai khoan");
            }
        }
        else
        {
            patientProfile = await dbContext.PatientProfiles.FirstOrDefaultAsync(
                item => item.AccountUuid == uuid,
                cancellationToken);
            if (patientProfile is null)
            {
                throw new InvalidOperationException("Khong tim thay ho so benh nhan cua tai khoan");
            }
        }
        var slug = request.Slug?.Trim();
        var email = request.Email?.Trim().ToLowerInvariant();

        if (role.IsDoctor)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                throw new InvalidOperationException("Slug bac si la bat buoc");
            }
            if (await dbContext.DoctorProfiles.AnyAsync(
                    item => item.Slug == slug &&
                            item.Uuid != doctorProfile!.Uuid,
                    cancellationToken))
            {
                throw new InvalidOperationException("Slug bac si da ton tai");
            }
        }
        else
        {
            if (!request.Gender.HasValue || !request.Birthdate.HasValue || string.IsNullOrWhiteSpace(email))
            {
                throw new InvalidOperationException("Gioi tinh, ngay sinh va email benh nhan la bat buoc");
            }
            if (request.Birthdate.Value >= DateOnly.FromDateTime(DateTime.UtcNow))
            {
                throw new InvalidOperationException("Ngay sinh phai truoc ngay hien tai");
            }
            if (await dbContext.PatientProfiles.AnyAsync(
                    item => item.Email == email &&
                            item.Uuid != patientProfile!.Uuid,
                    cancellationToken))
            {
                throw new InvalidOperationException("Email da duoc su dung");
            }
        }

        account.Phone = phone;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            account.Password = passwordHasher.Hash(request.Password);
        }
        account.HospitalUuid = request.HospitalUuid;
        account.Status = request.Status;
        account.UpdatedAt = DateTime.UtcNow;

        if (role.IsDoctor)
        {
            doctorProfile!.Avatar = request.Avatar?.Trim() ?? string.Empty;
            doctorProfile.Name = name;
            doctorProfile.Slug = slug!;
            doctorProfile.Price = request.Price ?? 0;
            doctorProfile.DepartmentDisplay = request.DepartmentDisplay?.Trim() ?? string.Empty;
            doctorProfile.Introduction = request.Introduction?.Trim() ?? string.Empty;
            doctorProfile.Expertise = request.Expertise?.Trim() ?? string.Empty;
            doctorProfile.Specialty = request.Specialty?.Trim() ?? string.Empty;
            doctorProfile.Workplace = request.Workplace?.Trim() ?? string.Empty;
            doctorProfile.IsFeatured = request.IsFeatured;
            doctorProfile.HospitalUuid = request.HospitalUuid;
        }
        else
        {
            patientProfile!.Avatar = request.Avatar?.Trim() ?? string.Empty;
            patientProfile.Name = name;
            patientProfile.Gender = request.Gender!.Value;
            patientProfile.Birthdate = request.Birthdate!.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            patientProfile.MedicalCode = request.MedicalCode?.Trim() ?? string.Empty;
            patientProfile.Email = email!;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return (await MapAccountsAsync([account], cancellationToken)).Single();
    }

    public async Task<bool> DeleteAccountAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (account is null) return false;

        account.DeletedAt = DateTime.UtcNow;
        account.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreAccountAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt != null,
            cancellationToken);
        if (account is null) return false;

        account.DeletedAt = null;
        account.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<IReadOnlyList<AccountResponse>> MapAccountsAsync(
        IReadOnlyList<Account> accounts,
        CancellationToken cancellationToken)
    {
        var roleIds = accounts.Where(item => item.RoleUuid.HasValue)
            .Select(item => item.RoleUuid!.Value)
            .Distinct()
            .ToList();
        var hospitalIds = accounts.Where(item => item.HospitalUuid.HasValue)
            .Select(item => item.HospitalUuid!.Value)
            .Distinct()
            .ToList();
        var accountIds = accounts.Select(item => item.Uuid).ToList();
        var roles = await dbContext.Roles.AsNoTracking()
            .Where(item => roleIds.Contains(item.Uuid))
            .ToDictionaryAsync(item => item.Uuid, cancellationToken);
        var hospitals = await dbContext.Hospitals.AsNoTracking()
            .Where(item => hospitalIds.Contains(item.Uuid))
            .ToDictionaryAsync(item => item.Uuid, cancellationToken);
        var patientProfiles = await dbContext.PatientProfiles.AsNoTracking()
            .Where(item => item.AccountUuid.HasValue && accountIds.Contains(item.AccountUuid.Value))
            .ToDictionaryAsync(item => item.AccountUuid!.Value, cancellationToken);
        var doctorProfiles = await dbContext.DoctorProfiles.AsNoTracking()
            .Where(item => item.AccountUuid.HasValue && accountIds.Contains(item.AccountUuid.Value))
            .ToDictionaryAsync(item => item.AccountUuid!.Value, cancellationToken);

        return accounts.Select(account =>
        {
            var role = account.RoleUuid.HasValue && roles.TryGetValue(account.RoleUuid.Value, out var foundRole)
                ? foundRole
                : null;
            var hospital = account.HospitalUuid.HasValue && hospitals.TryGetValue(account.HospitalUuid.Value, out var foundHospital)
                ? foundHospital
                : null;
            patientProfiles.TryGetValue(account.Uuid, out var patientProfile);
            doctorProfiles.TryGetValue(account.Uuid, out var doctorProfile);
            return new AccountResponse
            {
                Uuid = account.Uuid,
                Phone = account.Phone,
                RoleUuid = account.RoleUuid,
                RoleName = role?.Name,
                RoleIsDoctor = role?.IsDoctor ?? false,
                Status = account.Status,
                HospitalUuid = account.HospitalUuid,
                HospitalName = hospital?.Name,
                CreatedAt = account.CreatedAt,
                UpdatedAt = account.UpdatedAt,
                DeletedAt = account.DeletedAt,
                PatientProfile = patientProfile is null ? null : new PatientProfileResponse(
                    patientProfile.Uuid,
                    patientProfile.Avatar,
                    patientProfile.Name,
                    patientProfile.Gender,
                    patientProfile.Birthdate,
                    patientProfile.MedicalCode,
                    patientProfile.Email),
                DoctorProfile = doctorProfile is null ? null : new DoctorProfileResponse(
                    doctorProfile.Uuid,
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
                    doctorProfile.HospitalUuid),
            };
        }).ToList();
    }

    private async Task EnsurePhoneAvailableAsync(
        string phone,
        Guid? excludedUuid,
        CancellationToken cancellationToken)
    {
        var exists = await dbContext.Accounts.AnyAsync(
            item => item.Phone == phone &&
                    (!excludedUuid.HasValue || item.Uuid != excludedUuid.Value),
            cancellationToken);
        if (exists) throw new InvalidOperationException("So dien thoai da duoc su dung");
    }

    private async Task<Role> ValidateReferencesAsync(
        Guid? roleUuid,
        Guid? hospitalUuid,
        CancellationToken cancellationToken)
    {
        var role = roleUuid.HasValue
            ? await dbContext.Roles.FirstOrDefaultAsync(
                item => item.Uuid == roleUuid.Value && item.DeletedAt == null,
                cancellationToken)
            : null;
        if (role is null)
        {
            throw new InvalidOperationException("Role khong ton tai");
        }

        if (hospitalUuid.HasValue && !await dbContext.Hospitals.AnyAsync(
                item => item.Uuid == hospitalUuid.Value && item.DeletedAt == null,
                cancellationToken))
        {
            throw new InvalidOperationException("Co so y te khong ton tai");
        }

        return role;
    }

    private static string NormalizePhone(string phone)
    {
        var normalized = phone.Trim();
        return normalized.StartsWith("+84", StringComparison.Ordinal)
            ? $"0{normalized[3..]}"
            : normalized;
    }
}
