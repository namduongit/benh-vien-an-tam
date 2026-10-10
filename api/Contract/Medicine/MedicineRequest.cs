using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Medicine;

public class MedicineRequest
{
    [Required]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; init; } = string.Empty;

    [StringLength(500)]
    public string Image { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    [Range(0, int.MaxValue)]
    public int Price { get; init; }

    [EnumDataType(typeof(MedicineUnit))]
    public MedicineUnit Unit { get; init; } = MedicineUnit.Other;

    [EnumDataType(typeof(BaseStatus))]
    public BaseStatus Status { get; init; } = BaseStatus.Active;

    public bool IsInsured { get; init; }

    [Range(0, 1)]
    public float InsuranceCap { get; init; }
}

public sealed class CreateMedicineRequest : MedicineRequest;

public sealed class UpdateMedicineRequest : MedicineRequest;
