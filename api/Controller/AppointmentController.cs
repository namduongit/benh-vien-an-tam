using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Contract.Appointment;
using api.Lib;
using api.Model;
using api.Model.Enum;

namespace api.Controller;

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentController(DBContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAppointments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] Guid? doctorUuid = null,
        [FromQuery] Guid? hospitalUuid = null,
        [FromQuery] Guid? patientUuid = null,
        CancellationToken cancellationToken = default)
    {
        pageSize = Math.Min(pageSize, 100);

        var query = dbContext.Appointments.Where(x => x.DeletedAt == null);

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (doctorUuid.HasValue)
        {
            query = query.Where(x => x.DoctorUuid == doctorUuid.Value);
        }

        if (hospitalUuid.HasValue)
        {
            query = query.Where(x => x.HospitalUuid == hospitalUuid.Value);
        }

        if (patientUuid.HasValue)
        {
            query = query.Where(x => x.PatientUuid == patientUuid.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new AppointmentResponse
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAppointment(Guid id, CancellationToken cancellationToken = default)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });

        var response = new AppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            RoomUuid = appointment.RoomUuid,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return Ok(new { message = "Fetched successfully", data = response });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateAppointment(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = new Appointment
        {
            Uuid = Guid.NewGuid(),
            PatientName = request.PatientName,
            Gender = request.Gender,
            MedicalCode = request.MedicalCode,
            Note = request.Note,
            AppointmentDate = request.AppointmentDate,
            TimeSlot = request.TimeSlot,
            Type = request.Type,
            Status = AppointmentStatus.Pending,
            PatientUuid = request.PatientUuid,
            HospitalUuid = request.HospitalUuid,
            DoctorUuid = request.DoctorUuid,
            MedicalServiceUuid = request.MedicalServiceUuid,
            RoomUuid = request.RoomUuid,
            TotalPrice = request.TotalPrice,
            IsPaid = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Appointments.Add(appointment);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            RoomUuid = appointment.RoomUuid,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return StatusCode(StatusCodes.Status201Created,
            new { message = "Created successfully", data = response });
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateAppointment(
        Guid id,
        UpdateAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });

        appointment.PatientName = request.PatientName ?? appointment.PatientName;
        appointment.Gender = request.Gender;
        appointment.MedicalCode = request.MedicalCode ?? appointment.MedicalCode;
        appointment.Note = request.Note ?? appointment.Note;
        appointment.AppointmentDate = request.AppointmentDate != default ? request.AppointmentDate : appointment.AppointmentDate;
        appointment.TimeSlot = request.TimeSlot ?? appointment.TimeSlot;
        appointment.Type = request.Type;
        appointment.PatientUuid = request.PatientUuid ?? appointment.PatientUuid;
        appointment.DoctorUuid = request.DoctorUuid ?? appointment.DoctorUuid;
        appointment.MedicalServiceUuid = request.MedicalServiceUuid ?? appointment.MedicalServiceUuid;
        appointment.RoomUuid = request.RoomUuid ?? appointment.RoomUuid;
        appointment.TotalPrice = request.TotalPrice.HasValue ? request.TotalPrice.Value : appointment.TotalPrice;
        appointment.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            RoomUuid = appointment.RoomUuid,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteAppointment(Guid id, CancellationToken cancellationToken = default)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });

        appointment.DeletedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPut("{id}/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveAppointment(
        Guid id,
        ApproveAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });

        if (appointment.Status != AppointmentStatus.Pending)
            return BadRequest(new { message = "Invalid state", error = "Appointment must be in Pending status" });

        appointment.Status = AppointmentStatus.Approved;
        appointment.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            RoomUuid = appointment.RoomUuid,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }

    [HttpPut("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteAppointment(
        Guid id,
        CompleteAppointmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == id && x.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });

        if (appointment.Status != AppointmentStatus.Approved)
            return BadRequest(new { message = "Invalid state", error = "Appointment must be in Approved status" });

        appointment.Status = AppointmentStatus.Done;
        appointment.DoctorNote = request.DoctorNote ?? appointment.DoctorNote;
        appointment.IsPaid = true;
        appointment.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = new AppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            RoomUuid = appointment.RoomUuid,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };

        return Ok(new { message = "Updated successfully", data = response });
    }
}
