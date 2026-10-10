using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class UpdateHospitalStaffStatusRequest
{
    public BaseStatus Status { get; init; }
}