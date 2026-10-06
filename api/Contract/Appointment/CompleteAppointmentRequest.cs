namespace api.Contract.Appointment;

public sealed class CompleteAppointmentRequest
{
    public string DoctorNote { get; init; } = string.Empty;
}
