namespace api.Contract.Appointment;

public class ClinicalAppointmentResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string MedicalCode { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public DateTime AppointmentAt { get; set; }
    public string TypeLabel { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DoctorNote { get; set; } = string.Empty;
}
