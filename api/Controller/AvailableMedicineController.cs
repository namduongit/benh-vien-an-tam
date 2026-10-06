using api.Contract.AvailableMedicine;
using api.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvailableMedicineController : ControllerBase
{
    private readonly IAvailableMedicineService _availableMedicineService;

    public AvailableMedicineController(IAvailableMedicineService availableMedicineService)
    {
        _availableMedicineService = availableMedicineService;
    }

    private Guid? GetAccountUuidFromToken()
    {
        var accountUuidClaim = User.FindFirst("uuid")?.Value;
        if (Guid.TryParse(accountUuidClaim, out var accountUuid))
        {
            return accountUuid;
        }
        return null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAvailableMedicines([FromQuery] AvailableMedicineQueryDto query)
    {
        var accountUuid = GetAccountUuidFromToken();
        if (accountUuid == null)
        {
            return Unauthorized(new { message = "Xác thực không hợp lệ." });
        }

        var hospitalUuid = await _availableMedicineService.GetHospitalUuidByAccountAsync(accountUuid.Value);
        if (hospitalUuid == null)
        {
            return BadRequest(new { message = "Tài khoản chưa được gán với bệnh viện/chi nhánh nào." });
        }

        var result = await _availableMedicineService.GetAvailableMedicinesAsync(hospitalUuid.Value, query);
        return Ok(result);
    }

    [HttpGet("{medicineUuid:guid}")]
    public async Task<IActionResult> GetMedicineDetail(Guid medicineUuid)
    {
        var accountUuid = GetAccountUuidFromToken();
        if (accountUuid == null)
        {
            return Unauthorized(new { message = "Xác thực không hợp lệ." });
        }

        var hospitalUuid = await _availableMedicineService.GetHospitalUuidByAccountAsync(accountUuid.Value);
        if (hospitalUuid == null)
        {
            return BadRequest(new { message = "Tài khoản chưa được gán với bệnh viện/chi nhánh nào." });
        }

        var detail = await _availableMedicineService.GetMedicineDetailAsync(hospitalUuid.Value, medicineUuid);
        if (detail == null)
        {
            return NotFound(new { message = "Không tìm thấy thông tin thuốc trong kho của chi nhánh." });
        }

        return Ok(detail);
    }

    [HttpGet("units")]
    public IActionResult GetUnits()
    {
        var units = _availableMedicineService.GetMedicineUnits();
        return Ok(units);
    }
}