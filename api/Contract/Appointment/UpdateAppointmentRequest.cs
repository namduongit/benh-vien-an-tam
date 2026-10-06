using api.Model.Enum;

namespace api.Contract.Appointment;

public sealed class UpdateAppointmentRequest
{
    public string PatientName { get; init; } = string.Empty;

    public Gender Gender { get; init; }

    public string MedicalCode { get; init; } = string.Empty;

    public string Note { get; init; } = string.Empty;

    public DateTime AppointmentDate { get; init; }

    public Guid? TimeSlot { get; init; }

    public AppointmentType Type { get; init; }

    public Guid? PatientUuid { get; init; }

    public Guid? DoctorUuid { get; init; }

    public Guid? MedicalServiceUuid { get; init; }

    public Guid? RoomUuid { get; init; }

    public int? TotalPrice { get; init; }
}
