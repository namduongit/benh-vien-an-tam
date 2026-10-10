using api.Model.Enum;

namespace api.Contract.Medicine;

public sealed class MedicineResponse
{
    public Guid Uuid { get; init; }
    public string Image { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public int Price { get; init; }
    public MedicineUnit Unit { get; init; }
    public BaseStatus Status { get; init; }
    public bool IsInsured { get; init; }
    public float InsuranceCap { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static MedicineResponse FromModel(api.Model.Medicine medicine) => new()
    {
        Uuid = medicine.Uuid,
        Image = medicine.Image,
        Name = medicine.Name,
        Description = medicine.Description,
        Price = medicine.Price,
        Unit = medicine.Unit,
        Status = medicine.Status,
        IsInsured = medicine.IsInsured,
        InsuranceCap = medicine.InsuranceCap,
        CreatedAt = medicine.CreatedAt,
        UpdatedAt = medicine.UpdatedAt,
        DeletedAt = medicine.DeletedAt,
    };
}
