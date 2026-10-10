using api.Contract.Clinical;

namespace api.Service.Interfaces;

public interface IPrescriptionManagementService
{
    Task<PrescriptionResponse?> GetPrescriptionAsync(Guid appointmentUuid, CancellationToken cancellationToken);
    Task<(PrescriptionResponse? Data, string? ErrorMessage, int StatusCode)> SavePrescriptionAsync(Guid doctorUuid, Guid appointmentUuid, SavePrescriptionRequest request, CancellationToken cancellationToken);
}