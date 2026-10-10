using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Department;

public class DepartmentRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    [StringLength(200, MinimumLength = 2)]
    public string Slug { get; init; } = string.Empty;

    [StringLength(500)]
    public string Icon { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    [EnumDataType(typeof(BaseStatus))]
    public BaseStatus Status { get; init; } = BaseStatus.Active;
}

public sealed class CreateDepartmentRequest : DepartmentRequest;

public sealed class UpdateDepartmentRequest : DepartmentRequest;
