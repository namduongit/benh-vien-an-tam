
using api.Contract.Hospital;
using api.Lib;
using api.Model;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public sealed class HospitalService(DBContext dBContext)
{
    public async Task<IReadOnlyList<HospitalResponse>> GetHospitalsAsync(
        CancellationToken cancellationToken
    )
    {
        var hospitals = await dBContext.Hospitals
            .AsNoTracking()
            .OrderByDescending(hospital => hospital.UpdatedAt)
            .ToListAsync(cancellationToken);

        return hospitals.Select(HospitalResponse.FromModel).ToList();
    }

    public async Task<HospitalResponse?> GetHospitalByIdAsync(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        var hospital = await dBContext.Hospitals
            .AsNoTracking()
            .FirstOrDefaultAsync(
                hospital => hospital.Uuid == uuid && hospital.DeletedAt == null,
                cancellationToken
            );

        return hospital is null ? null : HospitalResponse.FromModel(hospital);
    }

    public async Task<HospitalResponse> CreateHospitalAsync(
        CreateHospitalRequest request,
        CancellationToken cancellationToken
    )
    {
        var isSlugExisted = await dBContext.Hospitals
            .AnyAsync(h => h.Slug == request.Slug && h.DeletedAt == null,
            cancellationToken);

        if (isSlugExisted) 
        {
            throw new InvalidOperationException("Slug da ton tai");
        }

        var hospital = new Hospital
        {
            Uuid = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            Slug = request.Slug,
            Image = request.Image,
            MapUrl = request.MapUrl,
            NumberOfRoom = request.NumberOfRoom,
            Description = request.Description,
            DetailService = request.DetailService,
            WorkingHour = request.WorkingHour,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        dBContext.Hospitals.Add(hospital);
        await dBContext.SaveChangesAsync(cancellationToken);

        return HospitalResponse.FromModel(hospital);
    }

    public async Task<HospitalResponse?> UpdateHospitalAsync(
        Guid uuid,
        UpdateHospitalRequest request,
        CancellationToken cancellationToken
    )
    {
        var isSlugExisted = await dBContext.Hospitals
            .AnyAsync(h => h.Slug == request.Slug && h.Uuid != uuid && h.DeletedAt == null,
            cancellationToken);

        if (isSlugExisted) 
        {
            throw new InvalidOperationException("Slug da ton tai");
        }

        var hospital = await dBContext.Hospitals
            .FirstOrDefaultAsync(
                h => h.Uuid == uuid && h.DeletedAt == null,
                cancellationToken
            );

        if (hospital is null) return null;

        hospital.Name = request.Name;
        hospital.Address = request.Address;
        hospital.Slug = request.Slug;
        hospital.Image = request.Image;
        hospital.MapUrl = request.MapUrl;
        hospital.NumberOfRoom = request.NumberOfRoom;
        hospital.Description = request.Description;
        hospital.DetailService = request.DetailService;
        hospital.WorkingHour = request.WorkingHour;
        hospital.Status = request.Status;
        hospital.UpdatedAt = DateTime.UtcNow;

        await dBContext.SaveChangesAsync(cancellationToken);

        return HospitalResponse.FromModel(hospital);
    }

    public async Task<bool> DeleteHospitalAsync(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        var hospital = await dBContext.Hospitals
            .FirstOrDefaultAsync(
                h => h.Uuid == uuid && h.DeletedAt == null,
                cancellationToken
            );

        if (hospital is null) return false;

        // Soft delete
        hospital.DeletedAt = DateTime.UtcNow;
        hospital.UpdatedAt = DateTime.UtcNow;

        await dBContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> RestoreHospitalAsync(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        var hospital = await dBContext.Hospitals
            .FirstOrDefaultAsync(
                h => h.Uuid == uuid && h.DeletedAt != null
            );

        if (hospital is null) return false;

        var isSlugExisted = await dBContext.Hospitals.AnyAsync(
            h => h.Uuid != uuid && h.Slug == hospital.Slug && h.DeletedAt == null
        );

        if (isSlugExisted)
        {
            throw new InvalidOperationException("Khong the khoi phuc vi slug da bi trung");
        }

        hospital.DeletedAt = null;
        hospital.UpdatedAt = DateTime.UtcNow;

        await dBContext.SaveChangesAsync(cancellationToken);

        return true;
    }
}