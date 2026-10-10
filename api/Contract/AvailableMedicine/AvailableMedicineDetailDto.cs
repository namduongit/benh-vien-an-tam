using api.Model.Enum;

namespace api.Contract.AvailableMedicine;

public class AvailableMedicineDetailDto
{
    public Guid MedicineUuid { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public int Price { get; set; }
    public MedicineUnit Unit { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int MinimumQuantity { get; set; }
    public string StockStatus { get; set; } = string.Empty;
    public bool IsInsured { get; set; }
    public float InsuranceCap { get; set; }
}