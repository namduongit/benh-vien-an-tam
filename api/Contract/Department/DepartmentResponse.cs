using api.Model.Enum;

namespace api.Contract.Department;

public sealed class DepartmentResponse
{
    public Guid Uuid { get; init; }
    public string Icon { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public BaseStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static DepartmentResponse FromModel(api.Model.Department department) => new()
    {
        Uuid = department.Uuid,
        Icon = department.Icon,
        Slug = department.Slug,
        Name = department.Name,
        Description = department.Description,
        Status = department.Status,
        CreatedAt = department.CreatedAt,
        UpdatedAt = department.UpdatedAt,
        DeletedAt = department.DeletedAt,
    };
}
