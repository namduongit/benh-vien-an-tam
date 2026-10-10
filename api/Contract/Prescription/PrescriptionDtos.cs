using api.Model.Enum;

namespace api.Contract.Prescription;

public class PagedResponse<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class PrescriptionQuery
{
    public string? Search { get; set; }
    public DateTime? Date { get; set; }
    public PrescriptionStatus? Status { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PrescriptionMetricsResponse
{
    public int MonthlyCount { get; set; }
    public int MonthlyDiffFromLastMonth { get; set; }
    public int UnpaidCount { get; set; }
    public int PaidCount { get; set; }
    public int CancelledCount { get; set; }
}

public class PrescriptionListResponse
{
    public Guid Uuid { get; set; }
    public string RxCode { get; set; } = null!;
    public string PatientName { get; set; } = null!;
    public string PatientMedicalCode { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public int MedicineCount { get; set; }
    public int TotalAmount { get; set; }
    public string Status { get; set; } = null!;
}

public class PrescriptionDetailResponse
{
    public Guid Uuid { get; set; }
    public string RxCode { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = null!;
    public string Note { get; set; } = null!;

    public PatientInfo Patient { get; set; } = null!;
    public List<PrescriptionDetailItemResponse> Details { get; set; } = new();
}

public class PatientInfo
{
    public string MedicalCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Gender { get; set; } = null!;
    public string Birthdate { get; set; } = null!; // Trả về dạng chuỗi định dạng sẵn
    public string Email { get; set; } = null!;
}

public class PrescriptionDetailItemResponse
{
    public Guid MedicineUuid { get; set; }
    public string MedicineName { get; set; } = null!;
    public string Unit { get; set; } = null!;
    public int Quantity { get; set; }
    public int QuantityPerDose { get; set; }
    public int DosesPerDay { get; set; }
    public int Duration { get; set; }
    public int Price { get; set; }
    public bool IsExternal { get; set; }
    public bool IsInsured { get; set; }
    public float InsuranceCap { get; set; }
    public string Note { get; set; } = null!;
}

public class CancelPrescriptionRequest
{
    public string Reason { get; set; } = null!;
}