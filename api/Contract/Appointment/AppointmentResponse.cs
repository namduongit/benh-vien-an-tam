namespace api.Contract.Appointment;

public sealed class AppointmentResponse
{
    public Guid Uuid { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string MedicalCode { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public DateTime AppointmentDate { get; set; }
    public Guid? TimeSlot { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? PatientUuid { get; set; }
    public Guid? HospitalUuid { get; set; }
    public Guid? DoctorUuid { get; set; }
    public Guid? MedicalServiceUuid { get; set; }
    public Guid? RoomUuid { get; set; }
    public string DoctorNote { get; set; } = string.Empty;
    public int TotalPrice { get; set; }
    public bool IsPaid { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
