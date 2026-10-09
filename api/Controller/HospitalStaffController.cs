using System.Security.Claims;
using System.Text;
using api.Config;
using api.Contract.Hospital;
using api.Lib;
using api.Model;
using api.Model.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controller;

[ApiController]
[Authorize]
[Route("api/hospitals/{hospitalUuid:guid}/staff")]
public sealed class HospitalStaffController(
    DBContext dbContext,
    PasswordHasher passwordHasher) : ControllerBase
{
    private const string DoctorRoleCode = "Doctor";
    private const string StaffRoleCode = "Staff";
    private const string WarehouseManagerRoleCode = "WarehouseManager";

    [HttpGet]
    public async Task<IActionResult> GetStaff(
        Guid hospitalUuid,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] BaseStatus? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return NotFound(new { message = "Hospital not found", error = "Resource does not exist" });

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var roles = await GetStaffRoles(cancellationToken);
        if (roles.Count == 0)
            return Conflict(new { message = "Staff roles are not configured", error = "STAFF_ROLES_NOT_CONFIGURED" });

        var allowedRoleIds = roles.Keys.ToHashSet();
        var accounts = await dbContext.Accounts
            .Where(account =>
                account.HospitalUuid == hospitalUuid &&
                account.DeletedAt == null &&
                account.RoleUuid.HasValue &&
                allowedRoleIds.Contains(account.RoleUuid.Value) &&
                (!status.HasValue || account.Status == status.Value))
            .OrderByDescending(account => account.CreatedAt)
            .ToListAsync(cancellationToken);

        var accountIds = accounts.Select(account => account.Uuid).ToArray();
        var doctors = await dbContext.DoctorProfiles
            .Where(doctor =>
                doctor.HospitalUuid == hospitalUuid &&
                doctor.AccountUuid.HasValue &&
                accountIds.Contains(doctor.AccountUuid.Value) &&
                doctor.DeletedAt == null)
            .ToListAsync(cancellationToken);
        var doctorIds = doctors.Select(doctor => doctor.Uuid).ToArray();
        var doctorDepartments = await dbContext.DoctorDepartments
            .Where(relation => relation.DoctorUuid.HasValue &&
                doctorIds.Contains(relation.DoctorUuid.Value))
            .ToListAsync(cancellationToken);
        var departmentIds = doctorDepartments
            .Where(relation => relation.DepartmentUuid.HasValue)
            .Select(relation => relation.DepartmentUuid!.Value)
            .Distinct()
            .ToArray();
        var departments = await dbContext.Departments
            .Where(department => departmentIds.Contains(department.Uuid))
            .ToDictionaryAsync(department => department.Uuid, cancellationToken);
        var doctorsByAccount = doctors
            .Where(doctor => doctor.AccountUuid.HasValue)
            .ToDictionary(doctor => doctor.AccountUuid!.Value);

        var items = accounts.Select(account =>
        {
            var doctor = doctorsByAccount.GetValueOrDefault(account.Uuid);
            var departmentUuid = doctor is null
                ? null
                : doctorDepartments
                    .FirstOrDefault(relation => relation.DoctorUuid == doctor.Uuid)?
                    .DepartmentUuid;
            var doctorRole = roles[account.RoleUuid!.Value];

            return new HospitalStaffResponse
            {
                AccountUuid = account.Uuid,
                DoctorUuid = doctor?.Uuid,
                DisplayName = doctor?.Name ?? account.Phone,
                Phone = account.Phone,
                RoleCode = doctorRole.Code,
                RoleName = doctorRole.Name,
                DepartmentUuid = departmentUuid,
                DepartmentName = departmentUuid.HasValue &&
                    departments.TryGetValue(departmentUuid.Value, out var department)
                        ? department.Name
                        : null,
                Specialty = doctor?.Specialty,
                Status = account.Status,
                CreatedAt = account.CreatedAt,
                UpdatedAt = account.UpdatedAt
            };
        })
        .Where(item =>
            (string.IsNullOrWhiteSpace(role) || item.RoleCode == role) &&
            (string.IsNullOrWhiteSpace(search) ||
                item.DisplayName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase) ||
                item.Phone.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase) ||
                item.RoleName.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase) ||
                (item.DepartmentName?.Contains(search.Trim(), StringComparison.OrdinalIgnoreCase) ?? false)))
        .ToList();

        return Ok(new
        {
            message = "Fetched successfully",
            data = items.Skip((page - 1) * pageSize).Take(pageSize),
            pagination = new
            {
                page,
                pageSize,
                totalCount = items.Count,
                totalPages = (int)Math.Ceiling((double)items.Count / pageSize)
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateStaff(
        Guid hospitalUuid,
        CreateHospitalStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return NotFound(new { message = "Hospital not found", error = "Resource does not exist" });

        var phone = request.Phone.Trim();
        if (await dbContext.Accounts.AnyAsync(account => account.Phone == phone, cancellationToken))
            return Conflict(new { message = "Phone number is already in use", error = "PHONE_ALREADY_EXISTS" });

        var roles = await GetStaffRoles(cancellationToken);
        var selectedRole = roles.FirstOrDefault(role => role.Value.Code == request.RoleCode);
        if (selectedRole.Key == Guid.Empty)
            return BadRequest(new { message = "Staff role is invalid", error = "INVALID_STAFF_ROLE" });

        Department? department = null;
        if (request.RoleCode == DoctorRoleCode)
        {
            if (string.IsNullOrWhiteSpace(request.Name) ||
                request.Name.Trim().Length < 2 ||
                string.IsNullOrWhiteSpace(request.Specialty) ||
                request.Specialty.Trim().Length < 2 ||
                !request.DepartmentUuid.HasValue ||
                !request.Price.HasValue ||
                request.Price < 0)
                return BadRequest(new { message = "Doctor name, specialty, department, and a valid consultation price are required", error = "DOCTOR_PROFILE_REQUIRED" });

            department = await dbContext.Departments
                .Where(item =>
                    item.Uuid == request.DepartmentUuid &&
                    item.Status == BaseStatus.Active &&
                    dbContext.HospitalDepartments.Any(assignment =>
                        assignment.HospitalUuid == hospitalUuid &&
                        assignment.DepartmentUuid == item.Uuid))
                .FirstOrDefaultAsync(cancellationToken);
            if (department is null)
                return BadRequest(new { message = "Department is not assigned to this hospital", error = "DEPARTMENT_NOT_ASSIGNED" });
        }

        var hospital = await dbContext.Hospitals
            .FirstAsync(item => item.Uuid == hospitalUuid, cancellationToken);
        var now = DateTime.UtcNow;
        var account = new Account
        {
            Uuid = Guid.NewGuid(),
            Phone = phone,
            Password = passwordHasher.Hash(request.Password),
            RoleUuid = selectedRole.Key,
            Status = BaseStatus.Active,
            HospitalUuid = hospitalUuid,
            CreatedAt = now,
            UpdatedAt = now
        };

        DoctorProfile? doctor = null;
        if (request.RoleCode == DoctorRoleCode)
        {
            doctor = new DoctorProfile
            {
                Uuid = Guid.NewGuid(),
                AccountUuid = account.Uuid,
                Avatar = "/images/doctor-placeholder.svg",
                Slug = $"{ToSlug(request.Name!)}-{account.Uuid.ToString("N")[..8]}",
                Name = request.Name!.Trim(),
                Price = request.Price!.Value,
                Specialty = request.Specialty!.Trim(),
                DepartmentDisplay = department!.Name,
                Introduction = "Hồ sơ bác sĩ mới.",
                Expertise = request.Specialty.Trim(),
                Workplace = hospital.Name,
                HospitalUuid = hospitalUuid,
                CreatedAt = now,
                UpdatedAt = now
            };
        }

        dbContext.Accounts.Add(account);
        if (doctor is not null)
        {
            dbContext.DoctorProfiles.Add(doctor);
            dbContext.DoctorDepartments.Add(new DoctorDepartment
            {
                Uuid = Guid.NewGuid(),
                DoctorUuid = doctor.Uuid,
                DepartmentUuid = department!.Uuid
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(account, selectedRole.Value, doctor, department);
        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{accountUuid:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid hospitalUuid,
        Guid accountUuid,
        UpdateHospitalStaffStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(request.Status))
            return BadRequest(new { message = "Account status is invalid" });

        var account = await FindStaffAccount(hospitalUuid, accountUuid, cancellationToken);
        if (account is null)
            return NotFound(new { message = "Staff account not found", error = "Resource does not exist" });

        account.Status = request.Status;
        account.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Updated successfully", data = new { accountUuid, status = account.Status, updatedAt = account.UpdatedAt } });
    }

    private async Task<Account?> FindStaffAccount(
        Guid hospitalUuid,
        Guid accountUuid,
        CancellationToken cancellationToken)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return null;

        var roleIds = (await GetStaffRoles(cancellationToken)).Keys.ToArray();
        return await dbContext.Accounts
            .Where(account =>
                account.Uuid == accountUuid &&
                account.HospitalUuid == hospitalUuid &&
                account.DeletedAt == null &&
                account.RoleUuid.HasValue &&
                roleIds.Contains(account.RoleUuid.Value))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<bool> HasBranchAccess(Guid hospitalUuid, CancellationToken cancellationToken)
    {
        var accountIdClaim = User.FindFirstValue("uuid");
        if (!Guid.TryParse(accountIdClaim, out var accountUuid))
            return false;

        return await dbContext.Hospitals.AnyAsync(
            hospital => hospital.Uuid == hospitalUuid &&
                        hospital.DeletedAt == null &&
                        dbContext.Accounts.Any(account =>
                            account.Uuid == accountUuid &&
                            account.HospitalUuid == hospitalUuid &&
                            account.DeletedAt == null &&
                            account.Status == BaseStatus.Active &&
                            account.RoleUuid.HasValue &&
                            dbContext.Roles.Any(role =>
                                role.Uuid == account.RoleUuid.Value &&
                                role.Status == BaseStatus.Active &&
                                role.DeletedAt == null &&
                                (role.Name.ToLower().Contains("admin") ||
                                 role.Name.ToLower().Contains("quản trị")))),
            cancellationToken);
    }

    private async Task<Dictionary<Guid, (string Code, string Name)>> GetStaffRoles(
        CancellationToken cancellationToken)
    {
        var roles = await dbContext.Roles
            .Where(role => role.DeletedAt == null && role.Status == BaseStatus.Active)
            .ToListAsync(cancellationToken);
        return roles
            .Select(role => (Role: role, Code: ResolveRoleCode(role)))
            .Where(item => item.Code is not null)
            .ToDictionary(item => item.Role.Uuid, item => (item.Code!, item.Role.Name));
    }

    private static string? ResolveRoleCode(Role role)
    {
        var normalized = role.Name.Trim().ToLowerInvariant();
        if (role.IsDoctor || normalized.Contains("doctor") || normalized.Contains("bác sĩ"))
            return DoctorRoleCode;
        if (normalized.Contains("warehouse") || normalized.Contains("kho"))
            return WarehouseManagerRoleCode;
        if (normalized.Contains("staff") || normalized.Contains("tiếp nhận"))
            return StaffRoleCode;
        return null;
    }

    private static HospitalStaffResponse ToResponse(
        Account account,
        (string Code, string Name) role,
        DoctorProfile? doctor,
        Department? department) =>
        new()
        {
            AccountUuid = account.Uuid,
            DoctorUuid = doctor?.Uuid,
            DisplayName = doctor?.Name ?? account.Phone,
            Phone = account.Phone,
            RoleCode = role.Code,
            RoleName = role.Name,
            DepartmentUuid = department?.Uuid,
            DepartmentName = department?.Name,
            Specialty = doctor?.Specialty,
            Status = account.Status,
            CreatedAt = account.CreatedAt,
            UpdatedAt = account.UpdatedAt
        };

    private static string ToSlug(string value)
    {
        var normalized = value
            .Replace("đ", "d", StringComparison.OrdinalIgnoreCase)
            .Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var character in normalized)
        {
            if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(character) ==
                System.Globalization.UnicodeCategory.NonSpacingMark)
                continue;
            builder.Append(char.IsLetterOrDigit(character) ? char.ToLowerInvariant(character) : '-');
        }

        return string.Join('-', builder.ToString().Split('-', StringSplitOptions.RemoveEmptyEntries));
    }
}