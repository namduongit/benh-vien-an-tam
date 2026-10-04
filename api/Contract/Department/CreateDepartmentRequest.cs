using System.ComponentModel.DataAnnotations;

namespace api.Contract.Department;

public sealed class CreateDepartmentRequest
{
    [Required(ErrorMessage = "Icon la bat buoc.")]
    public string Icon { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug la bat buoc.")]
    public string Slug { get; init; } = string.Empty;

    [Required(ErrorMessage = "Name la bat buoc.")]
    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;
}
