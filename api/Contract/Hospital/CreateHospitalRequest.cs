using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Hospital;

public sealed class CreateHospitalRequest
{
    [Required(ErrorMessage = "Ten co so y te la bat buoc")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Ten phai tu 2 den 200 ky tu")]
    public string Name { get; init; } = string.Empty;

    [Required(ErrorMessage = "Dia chi la bat buoc")]
    [StringLength(500, MinimumLength = 5, ErrorMessage = "Dia chi phai tu 5 den 500 ky tu")]
    public string Address { get; init; } = string.Empty;

    [Required(ErrorMessage = "Slug la bat buoc")]
    [RegularExpression(@"^[a-z0-9]+(?:-[a-z0-9]+)*$", ErrorMessage = "Slug chi duoc chua chu thuong, so va dau gach ngang")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "Slug phai tu 2 den 200 ky tu")]
    public string Slug { get; init; } = string.Empty;

    public string Image { get; init; } = string.Empty;

    public string MapUrl { get; init; } = string.Empty;

    [Range(0, int.MaxValue, ErrorMessage = "So phong la so duong")]
    public int NumberOfRoom { get; init; }

    public string Description { get; init; } = string.Empty;

    public string DetailService { get; init; } = string.Empty;

    public string WorkingHour { get; init; } = string.Empty;

    [EnumDataType(typeof(BaseStatus), ErrorMessage = "Trang thai khong hop le")]
    public BaseStatus Status { get; init; } = BaseStatus.Active;
}
