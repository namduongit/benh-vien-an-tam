using api.Contract.Prescription;

namespace api.Service.Interfaces;

public interface IPrescriptionService
{
    Task<PrescriptionMetricsResponse> GetMetricsAsync(Guid doctorUuid, DateTime targetDate);
    Task<PagedResponse<PrescriptionListResponse>> GetListAsync(Guid doctorUuid, PrescriptionQuery query);
    Task<PrescriptionDetailResponse?> GetDetailAsync(Guid uuid);
    Task<bool> CancelAsync(Guid uuid, Guid doctorUuid, CancelPrescriptionRequest request);
}