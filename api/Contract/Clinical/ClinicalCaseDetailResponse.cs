namespace api.Contract.Clinical;

public class ClinicalCaseDetailResponse : ClinicalAppointmentResponse
{
    public List<ClinicalMedicalServiceResponse> MedicalServices { get; set; } = [];
    public List<ClinicalServiceOptionResponse> AvailableMedicalServices { get; set; } = [];
    public List<ClinicalMedicineOptionResponse> AvailableMedicines { get; set; } = [];
    public PrescriptionResponse? Prescription { get; set; }
}

public class ClinicalMedicalServiceResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string AppointmentUuid { get; set; } = string.Empty;
    public string MedicalServiceUuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class ClinicalServiceOptionResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Price { get; set; }
}

public class ClinicalMedicineOptionResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
}

public class AddMedicalServiceRequest
{
    public string MedicalServiceUuid { get; set; } = string.Empty;
}

public class UpdateMedicalServiceRequest
{
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class SaveDiagnosisRequest
{
    public string DoctorNote { get; set; } = string.Empty;
}

public class PrescriptionResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public List<PrescriptionDetailResponse> Details { get; set; } = [];
}

public class PrescriptionDetailResponse
{
    public string Uuid { get; set; } = string.Empty;
    public string MedicineUuid { get; set; } = string.Empty;
    public string MedicineName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int QuantityPerDose { get; set; }
    public int DosesPerDay { get; set; }
    public int Duration { get; set; }
    public string Note { get; set; } = string.Empty;
}

public class SavePrescriptionRequest
{
    public string? Note { get; set; }
    public List<SavePrescriptionDetailItem> Items { get; set; } = [];
}

public class SavePrescriptionDetailItem
{
    public string MedicineUuid { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int QuantityPerDose { get; set; }
    public int DosesPerDay { get; set; }
    public int Duration { get; set; }
    public string Note { get; set; } = string.Empty;
}