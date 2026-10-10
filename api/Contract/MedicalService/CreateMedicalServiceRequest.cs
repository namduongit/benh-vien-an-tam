using System.ComponentModel.DataAnnotations;

namespace api.Contract.MedicalService;

public sealed class CreateMedicalServiceRequest
{
    [Required(ErrorMessage = "Image la bat buoc.")]
    public string Image { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug la bat buoc.")]
    public string Slug { get; init; } = string.Empty;

    [Required(ErrorMessage = "Name la bat buoc.")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Price la bat buoc.")]
    public int Price { get; init; }

    public string Description { get; init; } = string.Empty;

    public string DetailService { get; init; } = string.Empty;

    public string WorkingHour { get; init; } = string.Empty;

    public bool IsInsured { get; init; }

    public int InsuranceCap { get; init; }

    public bool IsFeatured { get; init; }
}
