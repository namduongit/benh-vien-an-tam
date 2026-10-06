using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class CreateRoomRequest
{
    [Required(ErrorMessage = "Name la bat buoc.")]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Name phai tu 1 den 100 ky tu.")]
    public string Name { get; init; } = string.Empty;

    public RoomStatus? Status { get; init; }
}
