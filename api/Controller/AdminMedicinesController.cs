using api.Contract.Medicine;
using api.Service;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/admin/medicines")]
public sealed class AdminMedicinesController(MedicineService medicineService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(new { Message = "Lay danh sach thuoc thanh cong", Data = await medicineService.GetMedicinesAsync(cancellationToken) });

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(Guid uuid, CancellationToken cancellationToken)
    {
        var medicine = await medicineService.GetMedicineByIdAsync(uuid, cancellationToken);
        return medicine is null
            ? NotFound(new { Message = "Khong tim thay thuoc" })
            : Ok(new { Message = "Lay thong tin thuoc thanh cong", Data = medicine });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateMedicineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var medicine = await medicineService.CreateMedicineAsync(request, cancellationToken);
            return Created($"api/admin/medicines/{medicine.Uuid}", new { Message = "Tao thuoc thanh cong", Data = medicine });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, UpdateMedicineRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var medicine = await medicineService.UpdateMedicineAsync(uuid, request, cancellationToken);
            return medicine is null
                ? NotFound(new { Message = "Khong tim thay thuoc" })
                : Ok(new { Message = "Cap nhat thuoc thanh cong", Data = medicine });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid, CancellationToken cancellationToken) =>
        await medicineService.DeleteMedicineAsync(uuid, cancellationToken)
            ? Ok(new { Message = "Xoa thuoc thanh cong" })
            : NotFound(new { Message = "Khong tim thay thuoc" });

    [HttpPatch("{uuid:guid}/restore")]
    public async Task<IActionResult> Restore(Guid uuid, CancellationToken cancellationToken)
    {
        try
        {
            return await medicineService.RestoreMedicineAsync(uuid, cancellationToken)
                ? Ok(new { Message = "Khoi phuc thuoc thanh cong" })
                : NotFound(new { Message = "Khong tim thay thuoc" });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }
}
