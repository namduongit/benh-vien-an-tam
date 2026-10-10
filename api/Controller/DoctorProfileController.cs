using System.Security.Claims;
using api.Contract.DoctorProfile;
using api.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/doctor-profile")]
[Authorize]
public class DoctorProfileController : ControllerBase
{
    private readonly IDoctorProfileService _doctorProfileService;

    public DoctorProfileController(IDoctorProfileService doctorProfileService)
    {
        _doctorProfileService = doctorProfileService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        // Trích xuất Claim "uuid" khớp chính xác với JwtService
        var accountUuidClaim = User.FindFirstValue("uuid");

        if (string.IsNullOrEmpty(accountUuidClaim) || !Guid.TryParse(accountUuidClaim, out var accountUuid))
        {
            return Unauthorized(new { message = "Token không hợp lệ hoặc thiếu thông tin định danh." });
        }

        var profile = await _doctorProfileService.GetProfileByAccountIdAsync(accountUuid, cancellationToken);

        if (profile == null)
        {
            return NotFound(new { message = "Không tìm thấy thông tin hồ sơ bác sĩ." });
        }

        return Ok(profile);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateDoctorProfileRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var accountUuidClaim = User.FindFirstValue("uuid");

        if (string.IsNullOrEmpty(accountUuidClaim) || !Guid.TryParse(accountUuidClaim, out var accountUuid))
        {
            return Unauthorized(new { message = "Token không hợp lệ hoặc thiếu thông tin định danh." });
        }

        var success = await _doctorProfileService.UpdateProfileAsync(accountUuid, request, cancellationToken);

        if (!success)
        {
            return NotFound(new { message = "Cập nhật thất bại. Không tìm thấy hồ sơ bác sĩ." });
        }

        return Ok(new { message = "Cập nhật hồ sơ thành công." });
    }
}