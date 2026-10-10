using api.Contract.Clinical;
using api.Lib;

namespace api.Service.Interfaces;

public interface IDoctorAppointmentService
{
    Task<ApiResponse<List<ClinicalAppointmentResponse>>> GetAppointmentsAsync(Guid doctorUuid, string? date, CancellationToken cancellationToken);
    Task<ApiResponse<ClinicalCaseDetailResponse>?> GetAppointmentDetailAsync(Guid doctorUuid, Guid appointmentUuid, CancellationToken cancellationToken);
    Task<ApiResponse<bool>> UpdateAppointmentStatusAsync(Guid doctorUuid, Guid appointmentUuid, string newStatus, CancellationToken cancellationToken);
}