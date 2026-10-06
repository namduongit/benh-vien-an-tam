using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.TimeWorking;

public sealed class CreateTimeWorkingRequest
{
    [Required(ErrorMessage = "DayOfWeek la bat buoc.")]
    [Range(0, 6, ErrorMessage = "DayOfWeek phai tu 0 den 6.")]
    public int DayOfWeek { get; init; }

    [Required(ErrorMessage = "StartTime la bat buoc.")]
    public TimeOnly StartTime { get; init; }

    [Required(ErrorMessage = "EndTime la bat buoc.")]
    public TimeOnly EndTime { get; init; }

    public BaseStatus? Status { get; init; }
}
