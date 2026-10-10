using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Contract.TimeWorking;
using api.Lib;
using api.Model;
using api.Model.Enum;

namespace api.Controller;

[ApiController]
[Route("api/time-workings")]
public sealed class TimeWorkingController(DBContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTimeWorkings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? dayOfWeek = null,
        [FromQuery] BaseStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.TimeWorkings.Where(x => x.DeletedAt == null);

        if (dayOfWeek.HasValue)
        {
            query = query.Where(x => x.DayOfWeek == dayOfWeek.Value);
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
            .Select(x => new TimeWorkingResponse
            {
                Uuid = x.Uuid,
                DayOfWeek = x.DayOfWeek,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                Status = x.Status.ToString(),
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

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateTimeWorking(
        CreateTimeWorkingRequest request,
        CancellationToken cancellationToken = default)
    {
        var timeWorking = new TimeWorking
        {
            Uuid = Guid.NewGuid(),
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status ?? BaseStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.TimeWorkings.Add(timeWorking);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new TimeWorkingResponse
        {
            Uuid = timeWorking.Uuid,
            DayOfWeek = timeWorking.DayOfWeek,
            StartTime = timeWorking.StartTime,
            EndTime = timeWorking.EndTime,
            Status = timeWorking.Status.ToString(),
            CreatedAt = timeWorking.CreatedAt,
            UpdatedAt = timeWorking.UpdatedAt
        };

        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateTimeWorking(
        Guid id,
        UpdateTimeWorkingRequest request,
        CancellationToken cancellationToken = default)
    {
        var timeWorking = await dbContext.TimeWorkings
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (timeWorking is null)
            return NotFound(new { message = "Time working not found", error = "Resource does not exist" });

        if (request.DayOfWeek.HasValue)
        {
            timeWorking.DayOfWeek = request.DayOfWeek.Value;
        }
        timeWorking.StartTime = request.StartTime;
        timeWorking.EndTime = request.EndTime;
        if (request.Status.HasValue)
        {
            timeWorking.Status = request.Status.Value;
        }
        timeWorking.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new TimeWorkingResponse
        {
            Uuid = timeWorking.Uuid,
            DayOfWeek = timeWorking.DayOfWeek,
            StartTime = timeWorking.StartTime,
            EndTime = timeWorking.EndTime,
            Status = timeWorking.Status.ToString(),
            CreatedAt = timeWorking.CreatedAt,
            UpdatedAt = timeWorking.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteTimeWorking(Guid id, CancellationToken cancellationToken = default)
    {
        var timeWorking = await dbContext.TimeWorkings
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (timeWorking is null)
            return NotFound(new { message = "Time working not found", error = "Resource does not exist" });

        timeWorking.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
