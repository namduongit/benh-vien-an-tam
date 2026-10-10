namespace api.Contract.Appointment;

public sealed class ClinicalMedicalServiceResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string AppointmentUuid { get; set; } = string.Empty;
    public string MedicalServiceUuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
