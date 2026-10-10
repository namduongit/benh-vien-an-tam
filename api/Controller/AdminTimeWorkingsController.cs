using api.Contract.TimeWorking;
using api.Service;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/admin/time-workings")]
public sealed class AdminTimeWorkingsController(TimeWorkingService timeWorkingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(new { Message = "Lay danh sach khung gio thanh cong", Data = await timeWorkingService.GetTimeWorkingsAsync(cancellationToken) });

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(Guid uuid, CancellationToken cancellationToken)
    {
        var working = await timeWorkingService.GetTimeWorkingByIdAsync(uuid, cancellationToken);
        return working is null
            ? NotFound(new { Message = "Khong tim thay khung gio" })
            : Ok(new { Message = "Lay thong tin khung gio thanh cong", Data = working });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateTimeWorkingRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var working = await timeWorkingService.CreateTimeWorkingAsync(request, cancellationToken);
            return Created($"api/admin/time-workings/{working.Uuid}", new { Message = "Tao khung gio thanh cong", Data = working });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, UpdateTimeWorkingRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var working = await timeWorkingService.UpdateTimeWorkingAsync(uuid, request, cancellationToken);
            return working is null
                ? NotFound(new { Message = "Khong tim thay khung gio" })
                : Ok(new { Message = "Cap nhat khung gio thanh cong", Data = working });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid, CancellationToken cancellationToken) =>
        await timeWorkingService.DeleteTimeWorkingAsync(uuid, cancellationToken)
            ? Ok(new { Message = "Xoa khung gio thanh cong" })
            : NotFound(new { Message = "Khong tim thay khung gio" });

    [HttpPatch("{uuid:guid}/restore")]
    public async Task<IActionResult> Restore(Guid uuid, CancellationToken cancellationToken)
    {
        try
        {
            return await timeWorkingService.RestoreTimeWorkingAsync(uuid, cancellationToken)
                ? Ok(new { Message = "Khoi phuc khung gio thanh cong" })
                : NotFound(new { Message = "Khong tim thay khung gio" });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }
}
