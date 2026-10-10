namespace api.Contract.MedicalService;

public sealed class UpdateMedicalServiceRequest
{
    public string Image { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public int? Price { get; init; }

    public string Description { get; init; } = string.Empty;

    public string DetailService { get; init; } = string.Empty;

    public string WorkingHour { get; init; } = string.Empty;

    public bool IsInsured { get; init; }

    public int? InsuranceCap { get; init; }

    public bool IsFeatured { get; init; }
}
