namespace api.Contract.Hospital;

public sealed class BranchAppointmentAssignmentRequest
{
    public Guid? DoctorUuid { get; init; }
    public Guid? RoomUuid { get; init; }
}
