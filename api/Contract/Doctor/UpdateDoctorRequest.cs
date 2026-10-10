namespace api.Contract.Doctor;

public sealed class UpdateDoctorRequest
{
    public Guid? AccountUuid { get; init; }

    public string Avatar { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public int? Price { get; init; }

    public string DepartmentDisplay { get; init; } = string.Empty;

    public string Introduction { get; init; } = string.Empty;

    public string Expertise { get; init; } = string.Empty;

    public string Specialty { get; init; } = string.Empty;

    public string Workplace { get; init; } = string.Empty;

    public bool IsFeatured { get; init; }

    public Guid? HospitalUuid { get; init; }
}
