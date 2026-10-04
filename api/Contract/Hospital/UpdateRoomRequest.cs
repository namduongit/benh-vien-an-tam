using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class UpdateRoomRequest
{
    public string Name { get; init; } = string.Empty;

    public RoomStatus? Status { get; init; }
}
