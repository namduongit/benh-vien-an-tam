using api.Contract.Department;
using api.Service;
using Microsoft.AspNetCore.Mvc;

namespace api.Controller;

[ApiController]
[Route("api/admin/departments")]
public sealed class AdminDepartmentsController(DepartmentService departmentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken) =>
        Ok(new { Message = "Lay danh sach chuyen khoa thanh cong", Data = await departmentService.GetDepartmentsAsync(cancellationToken) });

    [HttpGet("{uuid:guid}")]
    public async Task<IActionResult> GetById(Guid uuid, CancellationToken cancellationToken)
    {
        var department = await departmentService.GetDepartmentByIdAsync(uuid, cancellationToken);
        return department is null
            ? NotFound(new { Message = "Khong tim thay chuyen khoa" })
            : Ok(new { Message = "Lay thong tin chuyen khoa thanh cong", Data = department });
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var department = await departmentService.CreateDepartmentAsync(request, cancellationToken);
            return Created($"api/admin/departments/{department.Uuid}", new { Message = "Tao chuyen khoa thanh cong", Data = department });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpPut("{uuid:guid}")]
    public async Task<IActionResult> Update(Guid uuid, UpdateDepartmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var department = await departmentService.UpdateDepartmentAsync(uuid, request, cancellationToken);
            return department is null
                ? NotFound(new { Message = "Khong tim thay chuyen khoa" })
                : Ok(new { Message = "Cap nhat chuyen khoa thanh cong", Data = department });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }

    [HttpDelete("{uuid:guid}")]
    public async Task<IActionResult> Delete(Guid uuid, CancellationToken cancellationToken) =>
        await departmentService.DeleteDepartmentAsync(uuid, cancellationToken)
            ? Ok(new { Message = "Xoa chuyen khoa thanh cong" })
            : NotFound(new { Message = "Khong tim thay chuyen khoa" });

    [HttpPatch("{uuid:guid}/restore")]
    public async Task<IActionResult> Restore(Guid uuid, CancellationToken cancellationToken)
    {
        try
        {
            return await departmentService.RestoreDepartmentAsync(uuid, cancellationToken)
                ? Ok(new { Message = "Khoi phuc chuyen khoa thanh cong" })
                : NotFound(new { Message = "Khong tim thay chuyen khoa" });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { Message = exception.Message });
        }
    }
}
