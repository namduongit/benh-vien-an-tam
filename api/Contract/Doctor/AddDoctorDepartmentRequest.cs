using System.ComponentModel.DataAnnotations;

namespace api.Contract.Doctor;

public sealed class AddDoctorDepartmentRequest
{
    [Required(ErrorMessage = "DepartmentUuid la bat buoc.")]
    public Guid DepartmentUuid { get; init; }
}
