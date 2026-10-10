using api.Model.Enum;

namespace api.Contract.TimeWorking;

public sealed class TimeWorkingResponse
{
    public Guid Uuid { get; init; }
    public int DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public BaseStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static TimeWorkingResponse FromModel(api.Model.TimeWorking working) => new()
    {
        Uuid = working.Uuid,
        DayOfWeek = working.DayOfWeek,
        StartTime = working.StartTime,
        EndTime = working.EndTime,
        Status = working.Status,
        CreatedAt = working.CreatedAt,
        UpdatedAt = working.UpdatedAt,
        DeletedAt = working.DeletedAt,
    };
}
