using System.ComponentModel.DataAnnotations;

namespace api.Contract.Hospital;

public sealed class CreateHospitalRequest
{
    [Required(ErrorMessage = "Image la bat buoc.")]
    public string Image { get; init; } = string.Empty;

    [Required(ErrorMessage = "MapUrl la bat buoc.")]
    public string MapUrl { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug la bat buoc.")]
    public string Slug { get; init; } = string.Empty;

    [Required(ErrorMessage = "Name la bat buoc.")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Address la bat buoc.")]
    public string Address { get; init; } = string.Empty;

    [Required(ErrorMessage = "NumberOfRoom la bat buoc.")]
    public int NumberOfRoom { get; init; }

    public string Description { get; init; } = string.Empty;

    public string DetailService { get; init; } = string.Empty;

    public string WorkingHour { get; init; } = string.Empty;
}
