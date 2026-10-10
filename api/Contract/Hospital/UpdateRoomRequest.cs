using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class UpdateRoomRequest
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; init; }

    public RoomStatus? Status { get; init; }
}
