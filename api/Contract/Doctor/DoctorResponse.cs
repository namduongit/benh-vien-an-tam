namespace api.Contract.Doctor;

public sealed class DoctorResponse
{
    public Guid Uuid { get; set; }
    public Guid? AccountUuid { get; set; }
    public string Avatar { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public string DepartmentDisplay { get; set; } = string.Empty;
    public string Introduction { get; set; } = string.Empty;
    public string Expertise { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Workplace { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public Guid? HospitalUuid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
