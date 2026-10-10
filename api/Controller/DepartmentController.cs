using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Contract.Department;
using api.Lib;
using api.Model;
using api.Model.Enum;

namespace api.Controller;

[ApiController]
[Route("api/departments")]
public sealed class DepartmentController(DBContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDepartments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] BaseStatus? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.Departments.Where(x => x.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search) || x.Slug.Contains(search));
        }

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DepartmentResponse
            {
                Uuid = x.Uuid,
                Icon = x.Icon,
                Slug = x.Slug,
                Name = x.Name,
                Description = x.Description,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            message = "Fetched successfully",
            data = items,
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartment(Guid id, CancellationToken cancellationToken = default)
    {
        var department = await dbContext.Departments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (department is null)
            return NotFound(new { message = "Department not found", error = "Resource does not exist" });

        var response = new DepartmentResponse
        {
            Uuid = department.Uuid,
            Icon = department.Icon,
            Slug = department.Slug,
            Name = department.Name,
            Description = department.Description,
            Status = department.Status,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        };

        return Ok(new { message = "Fetched successfully", data = response });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateDepartment(
        CreateDepartmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var department = new Department
        {
            Uuid = Guid.NewGuid(),
            Icon = request.Icon,
            Slug = request.Slug,
            Name = request.Name,
            Description = request.Description,
            Status = BaseStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Departments.Add(department);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new DepartmentResponse
        {
            Uuid = department.Uuid,
            Icon = department.Icon,
            Slug = department.Slug,
            Name = department.Name,
            Description = department.Description,
            Status = department.Status,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        };

        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateDepartment(
        Guid id,
        UpdateDepartmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var department = await dbContext.Departments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (department is null)
            return NotFound(new { message = "Department not found", error = "Resource does not exist" });

        department.Icon = request.Icon ?? department.Icon;
        department.Slug = request.Slug ?? department.Slug;
        department.Name = request.Name ?? department.Name;
        department.Description = request.Description ?? department.Description;
        department.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new DepartmentResponse
        {
            Uuid = department.Uuid,
            Icon = department.Icon,
            Slug = department.Slug,
            Name = department.Name,
            Description = department.Description,
            Status = department.Status,
            CreatedAt = department.CreatedAt,
            UpdatedAt = department.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteDepartment(Guid id, CancellationToken cancellationToken = default)
    {
        var department = await dbContext.Departments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (department is null)
            return NotFound(new { message = "Department not found", error = "Resource does not exist" });

        department.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
