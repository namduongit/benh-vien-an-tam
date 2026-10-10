using api.Contract.Clinical;
using api.Lib;

namespace api.Service.Interfaces;

public interface IPrescriptionManagementService
{
    Task<ApiResponse<PrescriptionResponse>?> GetPrescriptionAsync(Guid appointmentUuid, CancellationToken cancellationToken);
    Task<ApiResponse<PrescriptionResponse>> SavePrescriptionAsync(Guid doctorUuid, Guid appointmentUuid, SavePrescriptionRequest request, CancellationToken cancellationToken);
}