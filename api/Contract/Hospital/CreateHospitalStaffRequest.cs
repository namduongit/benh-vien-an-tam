using System.ComponentModel.DataAnnotations;

namespace api.Contract.Hospital;

public sealed class CreateHospitalStaffRequest
{
    [Required, RegularExpression(@"^[0-9+()\-\s]{8,20}$")]
    public string Phone { get; init; } = string.Empty;

    [Required, MinLength(8), MaxLength(128)]
    public string Password { get; init; } = string.Empty;

    [Required]
    public string RoleCode { get; init; } = string.Empty;

    [StringLength(100, MinimumLength = 2)]
    public string? Name { get; init; }

    [StringLength(100, MinimumLength = 2)]
    public string? Specialty { get; init; }

    [Range(0, int.MaxValue)]
    public int? Price { get; init; }

    public Guid? DepartmentUuid { get; init; }
}
