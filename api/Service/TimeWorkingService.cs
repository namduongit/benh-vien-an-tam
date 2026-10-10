using api.Contract.TimeWorking;
using api.Lib;
using api.Model;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public sealed class TimeWorkingService(DBContext dbContext)
{
    public async Task<IReadOnlyList<TimeWorkingResponse>> GetTimeWorkingsAsync(
        CancellationToken cancellationToken)
    {
        var workings = await dbContext.TimeWorkings
            .AsNoTracking()
            .OrderBy(item => item.DayOfWeek)
            .ThenBy(item => item.StartTime)
            .ToListAsync(cancellationToken);
        return workings.Select(TimeWorkingResponse.FromModel).ToList();
    }

    public async Task<TimeWorkingResponse?> GetTimeWorkingByIdAsync(
        Guid uuid,
        CancellationToken cancellationToken)
    {
        var working = await dbContext.TimeWorkings
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Uuid == uuid, cancellationToken);
        return working is null ? null : TimeWorkingResponse.FromModel(working);
    }

    public async Task<TimeWorkingResponse> CreateTimeWorkingAsync(
        CreateTimeWorkingRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRange(request.StartTime, request.EndTime);
        await EnsureSlotAvailableAsync(
            request.DayOfWeek,
            request.StartTime,
            request.EndTime,
            null,
            cancellationToken);

        var now = DateTime.UtcNow;
        var working = new TimeWorking
        {
            Uuid = Guid.NewGuid(),
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status ?? Model.Enum.BaseStatus.Active,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.TimeWorkings.Add(working);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TimeWorkingResponse.FromModel(working);
    }

    public async Task<TimeWorkingResponse?> UpdateTimeWorkingAsync(
        Guid uuid,
        UpdateTimeWorkingRequest request,
        CancellationToken cancellationToken)
    {
        var working = await dbContext.TimeWorkings.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (working is null) return null;

        var dayOfWeek = request.DayOfWeek ?? working.DayOfWeek;
        ValidateRange(request.StartTime, request.EndTime);
        await EnsureSlotAvailableAsync(
            dayOfWeek,
            request.StartTime,
            request.EndTime,
            uuid,
            cancellationToken);

        working.DayOfWeek = dayOfWeek;
        working.StartTime = request.StartTime;
        working.EndTime = request.EndTime;
        working.Status = request.Status ?? working.Status;
        working.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return TimeWorkingResponse.FromModel(working);
    }

    public async Task<bool> DeleteTimeWorkingAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var working = await dbContext.TimeWorkings.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt == null,
            cancellationToken);
        if (working is null) return false;

        working.DeletedAt = DateTime.UtcNow;
        working.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreTimeWorkingAsync(Guid uuid, CancellationToken cancellationToken)
    {
        var working = await dbContext.TimeWorkings.FirstOrDefaultAsync(
            item => item.Uuid == uuid && item.DeletedAt != null,
            cancellationToken);
        if (working is null) return false;

        var request = new CreateTimeWorkingRequest
        {
            DayOfWeek = working.DayOfWeek,
            StartTime = working.StartTime,
            EndTime = working.EndTime,
            Status = working.Status,
        };
        await EnsureSlotAvailableAsync(
            request.DayOfWeek,
            request.StartTime,
            request.EndTime,
            uuid,
            cancellationToken);

        working.DeletedAt = null;
        working.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureSlotAvailableAsync(
        int dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        Guid? excludedUuid,
        CancellationToken cancellationToken)
    {
        var exists = await dbContext.TimeWorkings.AnyAsync(
            item => item.DayOfWeek == dayOfWeek &&
                    item.StartTime == startTime &&
                    item.EndTime == endTime &&
                    item.DeletedAt == null &&
                    (!excludedUuid.HasValue || item.Uuid != excludedUuid.Value),
            cancellationToken);
        if (exists) throw new InvalidOperationException("Khung gio lam viec da ton tai");
    }

    private static void ValidateRange(TimeOnly startTime, TimeOnly endTime)
    {
        if (startTime >= endTime)
        {
            throw new InvalidOperationException("Gio ket thuc phai sau gio bat dau");
        }
    }
}
