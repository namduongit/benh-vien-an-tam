using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Account;

public sealed class CreateAccountRequest
{
    [Required]
    [Phone]
    [StringLength(20)]
    public string Phone { get; init; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 8)]
    public string Password { get; init; } = string.Empty;

    [Required]
    public Guid? RoleUuid { get; init; }

    public Guid? HospitalUuid { get; init; }

    [EnumDataType(typeof(BaseStatus))]
    public BaseStatus Status { get; init; } = BaseStatus.Active;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [EnumDataType(typeof(Gender))]
    public Gender? Gender { get; init; }

    public DateOnly? Birthdate { get; init; }

    [EmailAddress]
    [StringLength(254)]
    public string? Email { get; init; }

    [StringLength(160)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Slug { get; init; }

    [StringLength(2048)]
    public string? Avatar { get; init; }

    [Range(0, int.MaxValue)]
    public int? Price { get; init; }

    [StringLength(200)]
    public string? DepartmentDisplay { get; init; }

    public string? Introduction { get; init; }

    public string? Expertise { get; init; }

    [StringLength(200)]
    public string? Specialty { get; init; }

    [StringLength(200)]
    public string? Workplace { get; init; }

    public bool IsFeatured { get; init; }

    [StringLength(50)]
    public string? MedicalCode { get; init; }
}

public sealed class UpdateAccountRequest
{
    [Required]
    [Phone]
    [StringLength(20)]
    public string Phone { get; init; } = string.Empty;

    [StringLength(100, MinimumLength = 8)]
    public string? Password { get; init; }

    [Required]
    public Guid? RoleUuid { get; init; }

    public Guid? HospitalUuid { get; init; }

    [EnumDataType(typeof(BaseStatus))]
    public BaseStatus Status { get; init; } = BaseStatus.Active;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [EnumDataType(typeof(Gender))]
    public Gender? Gender { get; init; }

    public DateOnly? Birthdate { get; init; }

    [EmailAddress]
    [StringLength(254)]
    public string? Email { get; init; }

    [StringLength(160)]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    public string? Slug { get; init; }

    [StringLength(2048)]
    public string? Avatar { get; init; }

    [Range(0, int.MaxValue)]
    public int? Price { get; init; }

    [StringLength(200)]
    public string? DepartmentDisplay { get; init; }

    public string? Introduction { get; init; }

    public string? Expertise { get; init; }

    [StringLength(200)]
    public string? Specialty { get; init; }

    [StringLength(200)]
    public string? Workplace { get; init; }

    public bool IsFeatured { get; init; }

    [StringLength(50)]
    public string? MedicalCode { get; init; }
}
