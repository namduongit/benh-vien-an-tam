using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Contract.MedicalService;
using api.Lib;
using api.Model;
using api.Model.Enum;

namespace api.Controller;

[ApiController]
[Route("api/medical-services")]
public sealed class MedicalServiceController(DBContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMedicalServices(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] BaseStatus? status = null,
        [FromQuery] bool? isFeatured = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.MedicalServices.Where(x => x.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search) || x.Slug.Contains(search));
        }

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (isFeatured.HasValue)
        {
            query = query.Where(x => x.IsFeatured == isFeatured.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MedicalServiceResponse
            {
                Uuid = x.Uuid,
                Image = x.Image,
                Slug = x.Slug,
                Name = x.Name,
                Price = x.Price,
                Description = x.Description,
                DetailService = x.DetailService,
                WorkingHour = x.WorkingHour,
                Status = x.Status.ToString(),
                IsInsured = x.IsInsured,
                InsuranceCap = x.InsuranceCap,
                IsFeatured = x.IsFeatured,
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
    public async Task<IActionResult> GetMedicalService(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await dbContext.MedicalServices
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (service is null)
            return NotFound(new { message = "Medical service not found", error = "Resource does not exist" });

        var response = new MedicalServiceResponse
        {
            Uuid = service.Uuid,
            Image = service.Image,
            Slug = service.Slug,
            Name = service.Name,
            Price = service.Price,
            Description = service.Description,
            DetailService = service.DetailService,
            WorkingHour = service.WorkingHour,
            Status = service.Status.ToString(),
            IsInsured = service.IsInsured,
            InsuranceCap = service.InsuranceCap,
            IsFeatured = service.IsFeatured,
            CreatedAt = service.CreatedAt,
            UpdatedAt = service.UpdatedAt
        };

        return Ok(new { message = "Fetched successfully", data = response });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateMedicalService(
        CreateMedicalServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        var service = new MedicalService
        {
            Uuid = Guid.NewGuid(),
            Image = request.Image,
            Slug = request.Slug,
            Name = request.Name,
            Price = request.Price,
            Description = request.Description,
            DetailService = request.DetailService,
            WorkingHour = request.WorkingHour,
            Status = BaseStatus.Active,
            IsInsured = request.IsInsured,
            InsuranceCap = request.InsuranceCap,
            IsFeatured = request.IsFeatured,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.MedicalServices.Add(service);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new MedicalServiceResponse
        {
            Uuid = service.Uuid,
            Image = service.Image,
            Slug = service.Slug,
            Name = service.Name,
            Price = service.Price,
            Description = service.Description,
            DetailService = service.DetailService,
            WorkingHour = service.WorkingHour,
            Status = service.Status.ToString(),
            IsInsured = service.IsInsured,
            InsuranceCap = service.InsuranceCap,
            IsFeatured = service.IsFeatured,
            CreatedAt = service.CreatedAt,
            UpdatedAt = service.UpdatedAt
        };

        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateMedicalService(
        Guid id,
        UpdateMedicalServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        var service = await dbContext.MedicalServices
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (service is null)
            return NotFound(new { message = "Medical service not found", error = "Resource does not exist" });

        service.Image = request.Image ?? service.Image;
        service.Slug = request.Slug ?? service.Slug;
        service.Name = request.Name ?? service.Name;
        service.Price = request.Price.HasValue ? request.Price.Value : service.Price;
        service.Description = request.Description ?? service.Description;
        service.DetailService = request.DetailService ?? service.DetailService;
        service.WorkingHour = request.WorkingHour ?? service.WorkingHour;
        service.IsInsured = request.IsInsured;
        service.InsuranceCap = request.InsuranceCap.HasValue ? request.InsuranceCap.Value : service.InsuranceCap;
        service.IsFeatured = request.IsFeatured;
        service.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new MedicalServiceResponse
        {
            Uuid = service.Uuid,
            Image = service.Image,
            Slug = service.Slug,
            Name = service.Name,
            Price = service.Price,
            Description = service.Description,
            DetailService = service.DetailService,
            WorkingHour = service.WorkingHour,
            Status = service.Status.ToString(),
            IsInsured = service.IsInsured,
            InsuranceCap = service.InsuranceCap,
            IsFeatured = service.IsFeatured,
            CreatedAt = service.CreatedAt,
            UpdatedAt = service.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteMedicalService(Guid id, CancellationToken cancellationToken = default)
    {
        var service = await dbContext.MedicalServices
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (service is null)
            return NotFound(new { message = "Medical service not found", error = "Resource does not exist" });

        service.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
