using api.Contract.AvailableMedicine;
using api.Contract.Common;
using api.Lib;
using api.Model.Enum;
using api.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public class AvailableMedicineService : IAvailableMedicineService
{
    private readonly DBContext _dbContext;

    public AvailableMedicineService(DBContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Guid?> GetHospitalUuidByAccountAsync(Guid accountUuid)
    {
        var account = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Uuid == accountUuid && a.DeletedAt == null);

        if (account?.HospitalUuid != null)
        {
            return account.HospitalUuid;
        }

        var doctorProfile = await _dbContext.DoctorProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.AccountUuid == accountUuid);

        return doctorProfile?.HospitalUuid;
    }

    public async Task<PagedResultDto<AvailableMedicineItemDto>> GetAvailableMedicinesAsync(Guid hospitalUuid, AvailableMedicineQueryDto query)
    {
        var queryable = _dbContext.MedicineInventories
            .AsNoTracking()
            .Where(mi => mi.HospitalUuid == hospitalUuid && mi.DeletedAt == null)
            .Join(
                _dbContext.Medicines.Where(m => m.DeletedAt == null && m.Status == BaseStatus.Active),
                mi => mi.MedicineUuid,
                m => m.Uuid,
                (mi, m) => new { Inventory = mi, Medicine = m }
            );

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var searchLower = query.Search.Trim().ToLower();
            queryable = queryable.Where(x => x.Medicine.Name.ToLower().Contains(searchLower));
        }

        if (query.Unit.HasValue)
        {
            queryable = queryable.Where(x => x.Medicine.Unit == query.Unit.Value);
        }

        if (query.StockStatus != StockStatusFilter.All)
        {
            switch (query.StockStatus)
            {
                case StockStatusFilter.InStock:
                    queryable = queryable.Where(x => x.Inventory.Quantity > x.Inventory.MinimumQuantity);
                    break;
                case StockStatusFilter.LowStock:
                    queryable = queryable.Where(x => x.Inventory.Quantity > 0 && x.Inventory.Quantity <= x.Inventory.MinimumQuantity);
                    break;
                case StockStatusFilter.OutOfStock:
                    queryable = queryable.Where(x => x.Inventory.Quantity <= 0);
                    break;
            }
        }

        int totalItems = await queryable.CountAsync();

        var pageIndex = query.PageIndex < 1 ? 1 : query.PageIndex;
        var pageSize = query.PageSize < 1 ? 5 : query.PageSize;

        var items = await queryable
            .OrderBy(x => x.Medicine.Name)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AvailableMedicineItemDto
            {
                MedicineUuid = x.Medicine.Uuid,
                InventoryUuid = x.Inventory.Uuid,
                Name = x.Medicine.Name,
                Unit = x.Medicine.Unit,
                UnitName = GetUnitDisplayName(x.Medicine.Unit),
                Price = x.Medicine.Price,
                Quantity = x.Inventory.Quantity,
                MinimumQuantity = x.Inventory.MinimumQuantity,
                StockStatus = x.Inventory.Quantity <= 0 ? "Hết hàng"
                            : (x.Inventory.Quantity <= x.Inventory.MinimumQuantity ? "Sắp hết" : "Còn hàng")
            })
            .ToListAsync();

        return new PagedResultDto<AvailableMedicineItemDto>
        {
            Items = items,
            TotalItems = totalItems,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<AvailableMedicineDetailDto?> GetMedicineDetailAsync(Guid hospitalUuid, Guid medicineUuid)
    {
        var result = await _dbContext.MedicineInventories
            .AsNoTracking()
            .Where(mi => mi.HospitalUuid == hospitalUuid && mi.MedicineUuid == medicineUuid && mi.DeletedAt == null)
            .Join(
                _dbContext.Medicines.Where(m => m.DeletedAt == null),
                mi => mi.MedicineUuid,
                m => m.Uuid,
                (mi, m) => new AvailableMedicineDetailDto
                {
                    MedicineUuid = m.Uuid,
                    Code = "MED-" + m.Uuid.ToString().Substring(0, 4).ToUpper(),
                    Name = m.Name,
                    Image = m.Image,
                    Price = m.Price,
                    Unit = m.Unit,
                    UnitName = GetUnitDisplayName(m.Unit),
                    Quantity = mi.Quantity,
                    MinimumQuantity = mi.MinimumQuantity,
                    StockStatus = mi.Quantity <= 0 ? "Hết hàng"
                                : (mi.Quantity <= mi.MinimumQuantity ? "Sắp hết" : "Còn hàng"),
                    IsInsured = m.IsInsured,
                    InsuranceCap = m.InsuranceCap
                }
            )
            .FirstOrDefaultAsync();

        return result;
    }

    public List<object> GetMedicineUnits()
    {
        return Enum.GetValues(typeof(MedicineUnit))
            .Cast<MedicineUnit>()
            .Select(u => new
            {
                Id = (int)u,
                Key = u.ToString(),
                Name = GetUnitDisplayName(u)
            })
            .ToList<object>();
    }

    private static string GetUnitDisplayName(MedicineUnit unit) => unit switch
    {
        MedicineUnit.Tablet => "Viên",
        MedicineUnit.Bottle => "Chai",
        MedicineUnit.Box => "Hộp",
        MedicineUnit.Tube => "Tuýp",
        MedicineUnit.Sachet => "Gói",
        _ => "Khác"
    };
}