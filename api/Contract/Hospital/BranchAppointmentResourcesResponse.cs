namespace api.Contract.Hospital;

public sealed class BranchAppointmentResourcesResponse
{
    public List<BranchAppointmentRoomResponse> Rooms { get; init; } = [];
    public List<BranchAppointmentDoctorResponse> Doctors { get; init; } = [];
    public List<BranchAppointmentMedicalServiceResponse> Services { get; init; } = [];
    public List<BranchAppointmentWorkingResponse> TimeWorkings { get; init; } = [];
}

public sealed class BranchAppointmentRoomResponse
{
    public Guid Uuid { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
}

public sealed class BranchAppointmentDoctorResponse
{
    public Guid Uuid { get; init; }
    public string Name { get; init; } = string.Empty;
}

public sealed class BranchAppointmentMedicalServiceResponse
{
    public Guid Uuid { get; init; }
    public string Name { get; init; } = string.Empty;
    public int Price { get; init; }
}

public sealed class BranchAppointmentWorkingResponse
{
    public Guid Uuid { get; init; }
    public int DayOfWeek { get; init; }
    public string StartTime { get; init; } = string.Empty;
    public string EndTime { get; init; } = string.Empty;
}
