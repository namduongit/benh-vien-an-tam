using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Contract.Doctor;
using api.Lib;
using api.Model;

namespace api.Controller;

[ApiController]
[Route("api/doctors")]
public sealed class DoctorController(DBContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] Guid? hospitalId = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.DoctorProfiles
            .Where(x => x.DeletedAt == null &&
                (!x.AccountUuid.HasValue ||
                 dbContext.Accounts.Any(account =>
                     account.Uuid == x.AccountUuid.Value &&
                     account.DeletedAt == null &&
                     account.Status == api.Model.Enum.BaseStatus.Active)))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search) || x.Slug.Contains(search));
        }

        if (hospitalId.HasValue)
        {
            query = query.Where(x => x.HospitalUuid == hospitalId.Value);
        }

        if (departmentId.HasValue)
        {
            query = from d in query
                    join dd in dbContext.DoctorDepartments on d.Uuid equals dd.DoctorUuid
                    where dd.DepartmentUuid == departmentId.Value
                    select d;
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.Uuid)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DoctorResponse
            {
                Uuid = x.Uuid,
                AccountUuid = x.AccountUuid,
                Avatar = x.Avatar,
                Slug = x.Slug,
                Name = x.Name,
                Price = x.Price,
                DepartmentDisplay = x.DepartmentDisplay,
                Introduction = x.Introduction,
                Expertise = x.Expertise,
                Specialty = x.Specialty,
                Workplace = x.Workplace,
                IsFeatured = x.IsFeatured,
                HospitalUuid = x.HospitalUuid,
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
    public async Task<IActionResult> GetDoctor(Guid id, CancellationToken cancellationToken = default)
    {
        var doctor = await dbContext.DoctorProfiles
            .Where(x => x.Uuid == id &&
                x.DeletedAt == null &&
                (!x.AccountUuid.HasValue ||
                 dbContext.Accounts.Any(account =>
                     account.Uuid == x.AccountUuid.Value &&
                     account.DeletedAt == null &&
                     account.Status == api.Model.Enum.BaseStatus.Active)))
            .FirstOrDefaultAsync(cancellationToken);

        if (doctor is null)
            return NotFound(new { message = "Doctor not found", error = "Resource does not exist" });

        var response = new DoctorResponse
        {
            Uuid = doctor.Uuid,
            AccountUuid = doctor.AccountUuid,
            Avatar = doctor.Avatar,
            Slug = doctor.Slug,
            Name = doctor.Name,
            Price = doctor.Price,
            DepartmentDisplay = doctor.DepartmentDisplay,
            Introduction = doctor.Introduction,
            Expertise = doctor.Expertise,
            Specialty = doctor.Specialty,
            Workplace = doctor.Workplace,
            IsFeatured = doctor.IsFeatured,
            HospitalUuid = doctor.HospitalUuid,
            CreatedAt = doctor.CreatedAt,
            UpdatedAt = doctor.UpdatedAt
        };

        return Ok(new { message = "Fetched successfully", data = response });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateDoctor(
        CreateDoctorRequest request,
        CancellationToken cancellationToken = default)
    {
        var doctor = new DoctorProfile
        {
            Uuid = Guid.NewGuid(),
            AccountUuid = request.AccountUuid,
            Avatar = request.Avatar,
            Slug = request.Slug,
            Name = request.Name,
            Price = request.Price,
            DepartmentDisplay = request.DepartmentDisplay,
            Introduction = request.Introduction,
            Expertise = request.Expertise,
            Specialty = request.Specialty,
            Workplace = request.Workplace,
            IsFeatured = request.IsFeatured,
            HospitalUuid = request.HospitalUuid,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.DoctorProfiles.Add(doctor);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new DoctorResponse
        {
            Uuid = doctor.Uuid,
            AccountUuid = doctor.AccountUuid,
            Avatar = doctor.Avatar,
            Slug = doctor.Slug,
            Name = doctor.Name,
            Price = doctor.Price,
            DepartmentDisplay = doctor.DepartmentDisplay,
            Introduction = doctor.Introduction,
            Expertise = doctor.Expertise,
            Specialty = doctor.Specialty,
            Workplace = doctor.Workplace,
            IsFeatured = doctor.IsFeatured,
            HospitalUuid = doctor.HospitalUuid,
            CreatedAt = doctor.CreatedAt,
            UpdatedAt = doctor.UpdatedAt
        };

        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateDoctor(
        Guid id,
        UpdateDoctorRequest request,
        CancellationToken cancellationToken = default)
    {
        var doctor = await dbContext.DoctorProfiles
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (doctor is null)
            return NotFound(new { message = "Doctor not found", error = "Resource does not exist" });

        doctor.AccountUuid = request.AccountUuid ?? doctor.AccountUuid;
        doctor.Avatar = request.Avatar ?? doctor.Avatar;
        doctor.Slug = request.Slug ?? doctor.Slug;
        doctor.Name = request.Name ?? doctor.Name;
        doctor.Price = request.Price.HasValue ? request.Price.Value : doctor.Price;
        doctor.DepartmentDisplay = request.DepartmentDisplay ?? doctor.DepartmentDisplay;
        doctor.Introduction = request.Introduction ?? doctor.Introduction;
        doctor.Expertise = request.Expertise ?? doctor.Expertise;
        doctor.Specialty = request.Specialty ?? doctor.Specialty;
        doctor.Workplace = request.Workplace ?? doctor.Workplace;
        doctor.IsFeatured = request.IsFeatured;
        doctor.HospitalUuid = request.HospitalUuid ?? doctor.HospitalUuid;
        doctor.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new DoctorResponse
        {
            Uuid = doctor.Uuid,
            AccountUuid = doctor.AccountUuid,
            Avatar = doctor.Avatar,
            Slug = doctor.Slug,
            Name = doctor.Name,
            Price = doctor.Price,
            DepartmentDisplay = doctor.DepartmentDisplay,
            Introduction = doctor.Introduction,
            Expertise = doctor.Expertise,
            Specialty = doctor.Specialty,
            Workplace = doctor.Workplace,
            IsFeatured = doctor.IsFeatured,
            HospitalUuid = doctor.HospitalUuid,
            CreatedAt = doctor.CreatedAt,
            UpdatedAt = doctor.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteDoctor(Guid id, CancellationToken cancellationToken = default)
    {
        var doctor = await dbContext.DoctorProfiles
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (doctor is null)
            return NotFound(new { message = "Doctor not found", error = "Resource does not exist" });

        // Soft delete: set DeletedAt timestamp
        doctor.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{id}/departments")]
    public async Task<IActionResult> GetDoctorDepartments(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = from dd in dbContext.DoctorDepartments
                    join d in dbContext.Departments on dd.DepartmentUuid equals d.Uuid
                    where dd.DoctorUuid == id
                    select d;

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new api.Contract.Department.DepartmentResponse
            {
                Uuid = x.Uuid,
                Icon = x.Icon,
                Slug = x.Slug,
                Name = x.Name,
                Description = x.Description,
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

    [HttpPost("{id}/departments")]
    [Authorize]
    public async Task<IActionResult> AddDoctorDepartment(
        Guid id,
        AddDoctorDepartmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var doctorDepartment = new DoctorDepartment
        {
            Uuid = Guid.NewGuid(),
            DoctorUuid = id,
            DepartmentUuid = request.DepartmentUuid
        };

        dbContext.DoctorDepartments.Add(doctorDepartment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created,
            new
            {
                message = "Created successfully",
                data = new
                {
                    uuid = doctorDepartment.Uuid,
                    doctorUuid = doctorDepartment.DoctorUuid,
                    departmentUuid = doctorDepartment.DepartmentUuid
                }
            });
    }

    [HttpDelete("{id}/departments/{departmentId}")]
    [Authorize]
    public async Task<IActionResult> RemoveDoctorDepartment(
        Guid id,
        Guid departmentId,
        CancellationToken cancellationToken = default)
    {
        var doctorDepartment = await dbContext.DoctorDepartments
            .Where(x => x.DoctorUuid == id && x.DepartmentUuid == departmentId)
            .FirstOrDefaultAsync(cancellationToken);

        if (doctorDepartment is null)
            return NotFound(new { message = "Doctor department not found", error = "Resource does not exist" });

        dbContext.DoctorDepartments.Remove(doctorDepartment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{id}/workings")]
    public async Task<IActionResult> GetDoctorWorkings(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = from dw in dbContext.DoctorWorkings
                    join tw in dbContext.TimeWorkings on dw.WorkingUuid equals tw.Uuid
                    where dw.DoctorUuid == id && tw.DeletedAt == null
                    select tw;

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new api.Contract.TimeWorking.TimeWorkingResponse
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

    [HttpPost("{id}/workings")]
    [Authorize]
    public async Task<IActionResult> AddDoctorWorking(
        Guid id,
        AddDoctorWorkingRequest request,
        CancellationToken cancellationToken = default)
    {
        var doctorWorking = new DoctorWorking
        {
            Uuid = Guid.NewGuid(),
            DoctorUuid = id,
            WorkingUuid = request.WorkingUuid
        };

        dbContext.DoctorWorkings.Add(doctorWorking);
        await dbContext.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created,
            new
            {
                message = "Created successfully",
                data = new
                {
                    uuid = doctorWorking.Uuid,
                    doctorUuid = doctorWorking.DoctorUuid,
                    workingUuid = doctorWorking.WorkingUuid
                }
            });
    }

    [HttpDelete("{id}/workings/{workingId}")]
    [Authorize]
    public async Task<IActionResult> RemoveDoctorWorking(
        Guid id,
        Guid workingId,
        CancellationToken cancellationToken = default)
    {
        var doctorWorking = await dbContext.DoctorWorkings
            .Where(x => x.DoctorUuid == id && x.WorkingUuid == workingId)
            .FirstOrDefaultAsync(cancellationToken);

        if (doctorWorking is null)
            return NotFound(new { message = "Doctor working not found", error = "Resource does not exist" });

        dbContext.DoctorWorkings.Remove(doctorWorking);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("{id}/appointments")]
    public async Task<IActionResult> GetDoctorAppointments(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.Appointments
            .Where(x => x.DoctorUuid == id && x.DeletedAt == null);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new api.Contract.Appointment.AppointmentResponse
            {
                Uuid = x.Uuid,
                PatientName = x.PatientName,
                Gender = x.Gender.ToString(),
                MedicalCode = x.MedicalCode,
                Note = x.Note,
                AppointmentDate = x.AppointmentDate,
                TimeSlot = x.TimeSlot,
                Type = x.Type.ToString(),
                Status = x.Status.ToString(),
                PatientUuid = x.PatientUuid,
                HospitalUuid = x.HospitalUuid,
                DoctorUuid = x.DoctorUuid,
                MedicalServiceUuid = x.MedicalServiceUuid,
                RoomUuid = x.RoomUuid,
                DoctorNote = x.DoctorNote,
                TotalPrice = x.TotalPrice,
                IsPaid = x.IsPaid,
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
}
