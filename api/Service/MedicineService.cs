using api.Contract.Medicine;
using api.Lib;
using api.Model;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public sealed class MedicineService(DBContext dbContext)
{
    public async Task<IReadOnlyList<MedicineResponse>> GetMedicinesAsync(
        CancellationToken cancellationToken)
    {
        var medicines = await dbContext.Medicines
            .AsNoTracking()
            .OrderByDescending(item => item.UpdatedAt)
            .ToListAsync(cancellationToken);
        return medicines.Select(MedicineResponse.FromModel).ToList();
    }

    public async Task<MedicineResponse?> GetMedicineByIdAsync(
        Guid uuid,
        CancellationToken cancellationToken)
    {
        var medicine = await dbContext.Medicines
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Uuid == uuid, cancellationToken);
        return medicine is null ? null : MedicineResponse.FromModel(medicine);
    }

    public async Task<MedicineResponse> CreateMedicineAsync(
        CreateMedicineRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        await EnsureNameAvailableAsync(name, null, cancellationToken);

        var now = DateTime.UtcNow;
        var medicine = new Medicine
        {
            Uuid = Guid.NewGuid(),
            Image = request.Image.Trim(),
            Name = name,
            Description = request.Description.Trim(),
            Price = request.Price,
            Unit = request.Unit,
            Status = request.Status,
            IsInsured = request.IsInsured,
            InsuranceCap = request.IsInsured ? request.InsuranceCap : 0,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Medicines.Add(medicine);
        await dbContext.SaveChangesAsync(cancellationToken);
        return MedicineResponse.FromModel(medicine);
    }

    public async Task<MedicineResponse?> UpdateMedicineAsync(
        Guid uuid,
        UpdateMedicineRequest request,
        CancellationToken cancellationToken)
    {
        var medicine = await dbContext.Medicines.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (medicine is null) return null;

        var name = request.Name.Trim();
        await EnsureNameAvailableAsync(name, uuid, cancellationToken);

        medicine.Image = request.Image.Trim();
        medicine.Name = name;
        medicine.Description = request.Description.Trim();
        medicine.Price = request.Price;
        medicine.Unit = request.Unit;
        medicine.Status = request.Status;
        medicine.IsInsured = request.IsInsured;
        medicine.InsuranceCap = request.IsInsured ? request.InsuranceCap : 0;
        medicine.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return MedicineResponse.FromModel(medicine);
    }

    public async Task<bool> DeleteMedicineAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var medicine = await dbContext.Medicines.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (medicine is null) return false;

        medicine.DeletedAt = DateTime.UtcNow;
        medicine.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreMedicineAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var medicine = await dbContext.Medicines.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt != null,
            cancellationToken);
        if (medicine is null) return false;

        await EnsureNameAvailableAsync(medicine.Name, uuid, cancellationToken);
        medicine.DeletedAt = null;
        medicine.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureNameAvailableAsync(
        string name,
        Guid? excludedUuid,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.ToLower();
        var exists = await dbContext.Medicines.AnyAsync(
            item => item.Name.ToLower() == normalizedName &&
                    item.DeletedAt == null &&
                    (!excludedUuid.HasValue || item.Uuid != excludedUuid.Value),
            cancellationToken);
        if (exists) throw new InvalidOperationException("Ten thuoc da ton tai");
    }
}
