using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Model;

public class AppointmentMedicalService
{
    [Key]
    public Guid Uuid { get; set; }
    public Guid? AppointmentUuid { get; set; }
    public Guid? MedicalServiceUuid { get; set; }
    public int Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public AppointmentMedicalServiceStatus Status { get; set; } = AppointmentMedicalServiceStatus.InProgress;
}
