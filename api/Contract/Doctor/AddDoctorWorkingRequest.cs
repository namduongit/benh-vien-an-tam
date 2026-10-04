using System.ComponentModel.DataAnnotations;

namespace api.Contract.Doctor;

public sealed class AddDoctorWorkingRequest
{
    [Required(ErrorMessage = "WorkingUuid la bat buoc.")]
    public Guid WorkingUuid { get; init; }
}
