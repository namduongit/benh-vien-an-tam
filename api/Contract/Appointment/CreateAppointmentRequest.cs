using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Appointment;

public sealed class CreateAppointmentRequest
{
    [Required(ErrorMessage = "PatientName la bat buoc.")]
    public string PatientName { get; init; } = string.Empty;

    [Required(ErrorMessage = "Gender la bat buoc.")]
    public Gender Gender { get; init; }

    [Required(ErrorMessage = "MedicalCode la bat buoc.")]
    public string MedicalCode { get; init; } = string.Empty;

    public string Note { get; init; } = string.Empty;

    [Required(ErrorMessage = "AppointmentDate la bat buoc.")]
    public DateTime AppointmentDate { get; init; }

    public Guid? TimeSlot { get; init; }

    [Required(ErrorMessage = "Type la bat buoc.")]
    public AppointmentType Type { get; init; }

    public Guid? PatientUuid { get; init; }

    [Required(ErrorMessage = "HospitalUuid la bat buoc.")]
    public Guid HospitalUuid { get; init; }

    public Guid? DoctorUuid { get; init; }

    public Guid? MedicalServiceUuid { get; init; }

    public Guid? RoomUuid { get; init; }

    [Required(ErrorMessage = "TotalPrice la bat buoc.")]
    public int TotalPrice { get; init; }
}
