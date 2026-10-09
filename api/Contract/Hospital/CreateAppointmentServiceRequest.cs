using System.ComponentModel.DataAnnotations;

namespace api.Contract.Hospital;

public sealed class CreateAppointmentServiceRequest
{
    [Required]
    public Guid MedicalServiceUuid { get; init; }

    [StringLength(500)]
    public string Description { get; init; } = string.Empty;
}
