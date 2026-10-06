using api.Model.Enum;

namespace api.Contract.TimeWorking;

public sealed class UpdateTimeWorkingRequest
{
    public int? DayOfWeek { get; init; }

    public TimeOnly StartTime { get; init; }

    public TimeOnly EndTime { get; init; }

    public BaseStatus? Status { get; init; }
}
