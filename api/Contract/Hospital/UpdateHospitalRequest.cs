using System.ComponentModel.DataAnnotations;

namespace api.Contract.Hospital;

public sealed class UpdateHospitalRequest
{
    public string Image { get; init; } = string.Empty;

    public string MapUrl { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public string Address { get; init; } = string.Empty;

    public int? NumberOfRoom { get; init; }

    public string Description { get; init; } = string.Empty;

    public string DetailService { get; init; } = string.Empty;

    public string WorkingHour { get; init; } = string.Empty;
}
