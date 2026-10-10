using api.Contract.Clinical;

namespace api.Service.Interfaces;

public interface IDoctorAppointmentService
{
    Task<List<ClinicalAppointmentResponse>> GetAppointmentsAsync(Guid doctorUuid, string? date, CancellationToken cancellationToken);
    Task<ClinicalCaseDetailResponse?> GetAppointmentDetailAsync(Guid doctorUuid, Guid appointmentUuid, CancellationToken cancellationToken);
    Task<string?> UpdateAppointmentStatusAsync(Guid doctorUuid, Guid appointmentUuid, string newStatus, CancellationToken cancellationToken);
}