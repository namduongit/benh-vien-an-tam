namespace api.Contract.Hospital;

public sealed class BranchAppointmentResponse
{
    public Guid Uuid { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string Gender { get; init; } = string.Empty;
    public string MedicalCode { get; init; } = string.Empty;
    public string Note { get; init; } = string.Empty;
    public DateTime AppointmentDate { get; init; }
    public Guid? TimeSlot { get; init; }
    public string Time { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public Guid? PatientUuid { get; init; }
    public Guid? HospitalUuid { get; init; }
    public Guid? DoctorUuid { get; init; }
    public string? DoctorName { get; init; }
    public Guid? MedicalServiceUuid { get; init; }
    public string? MedicalServiceName { get; init; }
    public Guid? RoomUuid { get; init; }
    public string? RoomName { get; init; }
    public string DoctorNote { get; init; } = string.Empty;
    public int TotalPrice { get; init; }
    public bool IsPaid { get; init; }
    public bool IsWalkIn { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public List<BranchAppointmentServiceResponse> Services { get; init; } = [];
}

public sealed class BranchAppointmentServiceResponse
{
    public Guid Uuid { get; init; }
    public Guid? MedicalServiceUuid { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Price { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
}
