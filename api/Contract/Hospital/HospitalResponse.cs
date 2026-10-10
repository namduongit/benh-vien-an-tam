using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class HospitalResponse
{
    public Guid Uuid { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Image { get; init; } = string.Empty;
    public string MapUrl { get; init; } = string.Empty;
    public int NumberOfRoom { get; init; }
    public string Description { get; init; } = string.Empty;
    public string DetailService { get; init; } = string.Empty;
    public string WorkingHour { get; init; } = string.Empty;
    public BaseStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static HospitalResponse FromModel(api.Model.Hospital hospital) => new()
    {
        Uuid = hospital.Uuid,
        Name = hospital.Name,
        Address = hospital.Address,
        Slug = hospital.Slug,
        Image = hospital.Image,
        MapUrl = hospital.MapUrl,
        NumberOfRoom = hospital.NumberOfRoom,
        Description = hospital.Description,
        DetailService = hospital.DetailService,
        WorkingHour = hospital.WorkingHour,
        Status = hospital.Status,
        CreatedAt = hospital.CreatedAt,
        UpdatedAt = hospital.UpdatedAt,
        DeletedAt = hospital.DeletedAt,
    };
}
