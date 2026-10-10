using api.Model.Enum;

namespace api.Contract.Account;

public sealed class AccountResponse
{
    public Guid Uuid { get; init; }
    public string Phone { get; init; } = string.Empty;
    public Guid? RoleUuid { get; init; }
    public string? RoleName { get; init; }
    public bool RoleIsDoctor { get; init; }
    public BaseStatus Status { get; init; }
    public Guid? HospitalUuid { get; init; }
    public string? HospitalName { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }
    public PatientProfileResponse? PatientProfile { get; init; }
    public DoctorProfileResponse? DoctorProfile { get; init; }
}

public sealed record PatientProfileResponse(
    Guid Uuid,
    string Avatar,
    string Name,
    Gender Gender,
    DateTime Birthdate,
    string MedicalCode,
    string Email);

public sealed record DoctorProfileResponse(
    Guid Uuid,
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
    Guid? HospitalUuid);

public sealed class AccountOptionsResponse
{
    public IReadOnlyList<AccountRoleOptionResponse> Roles { get; init; } = [];
    public IReadOnlyList<AccountHospitalOptionResponse> Hospitals { get; init; } = [];
}

public sealed record AccountRoleOptionResponse(
    Guid Uuid,
    string Name,
    bool IsDoctor);

public sealed record AccountHospitalOptionResponse(
    Guid Uuid,
    string Name);
