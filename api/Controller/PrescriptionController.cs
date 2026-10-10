using System.Security.Claims;
using api.Contract.Prescription;
using api.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/v1/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _prescriptionService;

    public PrescriptionsController(IPrescriptionService prescriptionService)
    {
        _prescriptionService = prescriptionService;
    }

    private Guid GetDoctorUuid()
    {
        // Điều chỉnh lại theo cấu trúc lưu claim Id của hệ thống bạn
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("uuid") ?? User.FindFirst("doctorUuid");
        return claim != null ? Guid.Parse(claim.Value) : Guid.Empty;
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics([FromQuery] DateTime? date)
    {
        var doctorUuid = GetDoctorUuid();
        var metrics = await _prescriptionService.GetMetricsAsync(doctorUuid, date ?? DateTime.UtcNow);
        return Ok(metrics);
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] PrescriptionQuery query)
    {
        var doctorUuid = GetDoctorUuid();
        var result = await _prescriptionService.GetListAsync(doctorUuid, query);
        return Ok(result);
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetDetail(Guid uuid)
    {
        var detail = await _prescriptionService.GetDetailAsync(uuid);
        if (detail == null)
        {
            return NotFound(new { message = "Không tìm thấy đơn thuốc." });
        }
        return Ok(detail);
    }

    [HttpPost("{uuid:guid}/cancel")]
    public async Task<IActionResult> CancelPrescription(Guid uuid, [FromBody] CancelPrescriptionRequest request)
    {
        var doctorUuid = GetDoctorUuid();
        var isSuccess = await _prescriptionService.CancelAsync(uuid, doctorUuid, request);

        if (!isSuccess)
        {
            return BadRequest(new { message = "Không thể hủy đơn thuốc. Đơn không tồn tại hoặc đã được thanh toán/hủy trước đó." });
        }

        return Ok(new { message = "Đã hủy đơn thuốc thành công." });
    }
}