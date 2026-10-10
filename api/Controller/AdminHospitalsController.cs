
using api.Contract.Hospital;
using api.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin/hospitals")]
public sealed class AdminHospitalsController(
    HospitalService hospitalService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken
    )
    {
        var hospitals = await hospitalService.GetHospitalsAsync(cancellationToken);

        return Ok(new
        {
            Message = "Lay danh sach co so y te thanh cong",
            Data = hospitals,
        });
    }

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        var hospital = await hospitalService.GetHospitalByIdAsync(uuid, cancellationToken);

        if (hospital is null)
            return NotFound(new { message = "Khong tim thay co so y te" });

        return Ok(new
        {
            Message = "Lay thong tin co so y te thanh cong",
            Data = hospital,
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateHospitalRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var hospital = await hospitalService.CreateHospitalAsync(request, cancellationToken);

            return Created(
                $"api/admin/hospitals/{hospital.Uuid}",
                new
                {
                    Message = "Tao co so y te thanh cong",
                    Data = hospital,
                }
            );
        }
        catch (InvalidOperationException e)
        {
            return Conflict(
                new { message = e.Message }
            );
        }
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(
        Guid uuid,
        [FromBody] UpdateHospitalRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var hospital = await hospitalService.UpdateHospitalAsync(uuid, request, cancellationToken);

            if (hospital is null)
                return NotFound(new { Message = "Khong tim thay co so y te" });

            return Ok(new
            {
                Message = "Cap nhat co so y te thanh cong",
                Data = hospital,
            });
        }
        catch (InvalidOperationException e)
        {
            return Conflict(new { Message = e.Message});
        }
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        var success = await hospitalService.DeleteHospitalAsync(uuid, cancellationToken);

        if (!success)
            return NotFound(new { Message = "Khong tim thay co so y te" });

        return Ok(new { Message = "Xoa co so y te thanh cong" });
    }

    [HttpPatch("{uuid:guid}/restore")]
    public async Task<IActionResult> Restore(
        Guid uuid,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var restored = await hospitalService.RestoreHospitalAsync(
                uuid,
                cancellationToken
            );

            if (!restored)
            {
                return NotFound(
                    new
                    {
                        Message = "Khong tim thay co so y te"
                    }
                );
            }

            return Ok(new
            {
                Message = "Khoi phuc co so y te thanh cong"
            });
        } catch (InvalidOperationException e)
        {
            return Conflict(new
            {
                Message = e.Message
            });
        }
    }
}