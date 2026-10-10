using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.Contract;
using api.Contract.Clinical;
using api.Service.Interfaces;

namespace api.Controller;

[ApiController]
[Route("api/internal/clinical")]
[Authorize]
public class InternalClinicalController(
    IDoctorAppointmentService appointmentService,
    IClinicalExaminationService examinationService,
    IPrescriptionManagementService prescriptionService) : ControllerBase
{
    private Guid GetCurrentDoctorUuid()
    {
        var uuidClaim = User.FindFirst("uuid")?.Value;
        return Guid.TryParse(uuidClaim, out var uuid) ? uuid : Guid.Empty;
    }

    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments([FromQuery] string? date, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await appointmentService.GetAppointmentsAsync(doctorUuid, date, cancellationToken);
        return ApiResponse<object>.RequestSuccess(result, "Lấy danh sách ca khám thành công.");
    }

    [HttpGet("appointments/{uuid}")]
    public async Task<IActionResult> GetAppointmentDetail(Guid uuid, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await appointmentService.GetAppointmentDetailAsync(doctorUuid, uuid, cancellationToken);

        if (result is null)
            return ApiResponse<object>.NotFound("Không tìm thấy ca khám.");

        return ApiResponse<object>.RequestSuccess(result, "Lấy thông tin ca khám thành công.");
    }

    [HttpPut("appointments/{uuid}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(Guid uuid, [FromBody] UpdateStatusRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        // Nhận chuỗi lỗi từ Service
        var errorMessage = await appointmentService.UpdateAppointmentStatusAsync(doctorUuid, uuid, request.Status, cancellationToken);

        if (errorMessage != null)
            return ApiResponse<object>.BadRequest(null, errorMessage);

        return ApiResponse<bool>.RequestSuccess(true, "Cập nhật trạng thái ca khám thành công.");
    }

    [HttpPost("appointments/{uuid}/medical-services")]
    public async Task<IActionResult> AddMedicalService(Guid uuid, [FromBody] AddMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await examinationService.AddMedicalServiceAsync(doctorUuid, uuid, request, cancellationToken);

        if (result is null)
            return ApiResponse<object>.BadRequest(null, "Không thể thêm dịch vụ.");

        return ApiResponse<object>.CreatedSuccess(result, "Thêm chỉ định dịch vụ thành công.");
    }

    [HttpPut("appointments/{appointmentUuid}/medical-services/{serviceUuid}")]
    public async Task<IActionResult> UpdateMedicalService(Guid appointmentUuid, Guid serviceUuid, [FromBody] UpdateMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await examinationService.UpdateMedicalServiceAsync(doctorUuid, appointmentUuid, serviceUuid, request, cancellationToken);

        if (result is null)
            return ApiResponse<object>.BadRequest(null, "Không thể cập nhật dịch vụ.");

        return ApiResponse<object>.RequestSuccess(result, "Cập nhật dịch vụ thành công.");
    }

    [HttpPost("appointments/{uuid}/diagnosis")]
    public async Task<IActionResult> SaveDiagnosis(Guid uuid, [FromBody] SaveDiagnosisRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        // Nhận kết quả bool từ Service
        var success = await examinationService.SaveDiagnosisAsync(doctorUuid, uuid, request, cancellationToken);

        if (!success)
            return ApiResponse<object>.BadRequest(null, "Không tìm thấy ca khám hoặc thông tin chẩn đoán bị trống.");

        return ApiResponse<bool>.RequestSuccess(true, "Lưu thông tin chẩn đoán thành công.");
    }

    [HttpGet("medicines/search")]
    public async Task<IActionResult> SearchMedicines([FromQuery] string? keyword, CancellationToken cancellationToken)
    {
        var result = await examinationService.SearchMedicinesAsync(keyword, cancellationToken);
        return ApiResponse<object>.RequestSuccess(result, "Tìm kiếm thuốc thành công.");
    }

    [HttpGet("appointments/{uuid}/prescription")]
    public async Task<IActionResult> GetPrescription(Guid uuid, CancellationToken cancellationToken)
    {
        var result = await prescriptionService.GetPrescriptionAsync(uuid, cancellationToken);

        if (result is null)
            return ApiResponse<object>.NotFound("Chưa có đơn thuốc.");

        return ApiResponse<object>.RequestSuccess(result, "Lấy đơn thuốc thành công.");
    }

    [HttpPost("appointments/{uuid}/prescription")]
    public async Task<IActionResult> SavePrescription(Guid uuid, [FromBody] SavePrescriptionRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        // Giải nén tuple từ Service trả về
        var (data, errorMessage, statusCode) = await prescriptionService.SavePrescriptionAsync(doctorUuid, uuid, request, cancellationToken);

        if (errorMessage != null)
        {
            return statusCode switch
            {
                404 => ApiResponse<object>.NotFound(errorMessage),
                400 => ApiResponse<object>.BadRequest(null, errorMessage),
                _ => ApiResponse<object>.InternalServerError(errorMessage)
            };
        }

        return ApiResponse<PrescriptionResponse>.RequestSuccess(data, "Lưu đơn thuốc thành công.");
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}