using api.Model.Enum;

namespace api.Contract.AvailableMedicine;

public class AvailableMedicineItemDto
{
    public Guid MedicineUuid { get; set; }
    public Guid InventoryUuid { get; set; }
    public string Name { get; set; } = string.Empty;
    public MedicineUnit Unit { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public int Price { get; set; }
    public int Quantity { get; set; }
    public int MinimumQuantity { get; set; }
    public string StockStatus { get; set; } = string.Empty;
}