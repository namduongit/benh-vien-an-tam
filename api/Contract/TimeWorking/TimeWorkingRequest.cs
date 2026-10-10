using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.TimeWorking;

public class TimeWorkingRequest
{
    [Range(0, 6)]
    public int DayOfWeek { get; init; }

    public TimeOnly StartTime { get; init; }

    public TimeOnly EndTime { get; init; }

    [EnumDataType(typeof(BaseStatus))]
    public BaseStatus Status { get; init; } = BaseStatus.Active;
}

public sealed class CreateTimeWorkingRequest : TimeWorkingRequest;

public sealed class UpdateTimeWorkingRequest : TimeWorkingRequest;
