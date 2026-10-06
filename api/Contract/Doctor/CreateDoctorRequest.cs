using System.ComponentModel.DataAnnotations;

namespace api.Contract.Doctor;

public sealed class CreateDoctorRequest
{
    public Guid? AccountUuid { get; init; }

    [Required(ErrorMessage = "Avatar la bat buoc.")]
    public string Avatar { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug la bat buoc.")]
    public string Slug { get; init; } = string.Empty;

    [Required(ErrorMessage = "Name la bat buoc.")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Price la bat buoc.")]
    public int Price { get; init; }

    public string DepartmentDisplay { get; init; } = string.Empty;

    public string Introduction { get; init; } = string.Empty;

    public string Expertise { get; init; } = string.Empty;

    public string Specialty { get; init; } = string.Empty;

    public string Workplace { get; init; } = string.Empty;

    public bool IsFeatured { get; init; }

    public Guid? HospitalUuid { get; init; }
}
