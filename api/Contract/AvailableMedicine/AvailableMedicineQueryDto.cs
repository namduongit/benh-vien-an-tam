using api.Model.Enum;

namespace api.Contract.AvailableMedicine;

public enum StockStatusFilter
{
    All = 0,
    InStock = 1,      // Còn hàng: Quantity > MinimumQuantity
    LowStock = 2,     // Sắp hết: 0 < Quantity <= MinimumQuantity
    OutOfStock = 3    // Hết hàng: Quantity <= 0
}

public class AvailableMedicineQueryDto
{
    public string? Search { get; set; }
    public MedicineUnit? Unit { get; set; }
    public StockStatusFilter StockStatus { get; set; } = StockStatusFilter.All;
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 5;
}