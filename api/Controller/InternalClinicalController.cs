using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using api.Contract.Clinical;
using api.Lib;
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
        return Ok(result);
    }

    [HttpGet("appointments/{uuid}")]
    public async Task<IActionResult> GetAppointmentDetail(Guid uuid, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await appointmentService.GetAppointmentDetailAsync(doctorUuid, uuid, cancellationToken);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Không tìm thấy ca khám.", 404));
        return Ok(result);
    }

    [HttpPut("appointments/{uuid}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(Guid uuid, [FromBody] UpdateStatusRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await appointmentService.UpdateAppointmentStatusAsync(doctorUuid, uuid, request.Status, cancellationToken);
        return Ok(result);
    }

    [HttpPost("appointments/{uuid}/medical-services")]
    public async Task<IActionResult> AddMedicalService(Guid uuid, [FromBody] AddMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await examinationService.AddMedicalServiceAsync(doctorUuid, uuid, request, cancellationToken);
        if (result is null) return BadRequest(ApiResponse<object>.Fail("Không thể thêm dịch vụ.", 400));
        return Ok(result);
    }

    [HttpPut("appointments/{appointmentUuid}/medical-services/{serviceUuid}")]
    public async Task<IActionResult> UpdateMedicalService(Guid appointmentUuid, Guid serviceUuid, [FromBody] UpdateMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await examinationService.UpdateMedicalServiceAsync(doctorUuid, appointmentUuid, serviceUuid, request, cancellationToken);
        if (result is null) return BadRequest(ApiResponse<object>.Fail("Không thể cập nhật dịch vụ.", 400));
        return Ok(result);
    }

    [HttpPost("appointments/{uuid}/diagnosis")]
    public async Task<IActionResult> SaveDiagnosis(Guid uuid, [FromBody] SaveDiagnosisRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await examinationService.SaveDiagnosisAsync(doctorUuid, uuid, request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("medicines/search")]
    public async Task<IActionResult> SearchMedicines([FromQuery] string? keyword, CancellationToken cancellationToken)
    {
        var result = await examinationService.SearchMedicinesAsync(keyword, cancellationToken);
        return Ok(result);
    }

    [HttpGet("appointments/{uuid}/prescription")]
    public async Task<IActionResult> GetPrescription(Guid uuid, CancellationToken cancellationToken)
    {
        var result = await prescriptionService.GetPrescriptionAsync(uuid, cancellationToken);
        if (result is null) return NotFound(ApiResponse<object>.Fail("Chưa có đơn thuốc.", 404));
        return Ok(result);
    }

    [HttpPost("appointments/{uuid}/prescription")]
    public async Task<IActionResult> SavePrescription(Guid uuid, [FromBody] SavePrescriptionRequest request, CancellationToken cancellationToken)
    {
        var doctorUuid = GetCurrentDoctorUuid();
        var result = await prescriptionService.SavePrescriptionAsync(doctorUuid, uuid, request, cancellationToken);
        return Ok(result);
    }
}

public class UpdateStatusRequest
{
    public string Status { get; set; } = string.Empty;
}