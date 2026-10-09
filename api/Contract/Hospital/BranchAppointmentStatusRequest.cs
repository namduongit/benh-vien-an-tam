using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class BranchAppointmentStatusRequest
{
    public AppointmentStatus Status { get; init; }
}
