using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class HospitalStaffResponse
{
    public Guid AccountUuid { get; init; }
    public Guid? DoctorUuid { get; init; }
    public string DisplayName { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string RoleCode { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;
    public Guid? DepartmentUuid { get; init; }
    public string? DepartmentName { get; init; }
    public string? Specialty { get; init; }
    public BaseStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}