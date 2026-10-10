namespace api.Contract.Appointment;

public sealed class ClinicalServiceOptionResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
}

public sealed class ClinicalMedicineOptionResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
}

public sealed class ClinicalCaseDetailResponse : ClinicalAppointmentResponse
{
    public List<ClinicalMedicalServiceResponse> MedicalServices { get; set; } = [];
    public List<ClinicalServiceOptionResponse> AvailableMedicalServices { get; set; } = [];
    public List<ClinicalMedicineOptionResponse> AvailableMedicines { get; set; } = [];
}
