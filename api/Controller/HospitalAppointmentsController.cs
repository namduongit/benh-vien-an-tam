using System.Security.Claims;
using api.Contract.Hospital;
using api.Lib;
using api.Model;
using api.Model.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controller;

[ApiController]
[Authorize]
[Route("api/hospitals/{hospitalUuid:guid}/appointments")]
public sealed class HospitalAppointmentsController(DBContext dbContext) : ControllerBase
{
    [HttpGet("resources")]
    public async Task<IActionResult> GetResources(
        Guid hospitalUuid,
        CancellationToken cancellationToken = default)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return NotFound(new { message = "Hospital not found", error = "Resource does not exist" });

        var rooms = await dbContext.Rooms
            .Where(item => item.HospitalUuid == hospitalUuid &&
                item.DeletedAt == null &&
                item.Status == RoomStatus.Available)
            .Select(item => new BranchAppointmentRoomResponse
            {
                Uuid = item.Uuid,
                Name = item.Name,
                Status = item.Status.ToString()
            })
            .ToListAsync(cancellationToken);
        var doctors = await dbContext.DoctorProfiles
            .Where(item => item.HospitalUuid == hospitalUuid &&
                item.DeletedAt == null &&
                (!item.AccountUuid.HasValue || dbContext.Accounts.Any(account =>
                    account.Uuid == item.AccountUuid.Value &&
                    account.Status == BaseStatus.Active &&
                    account.DeletedAt == null)))
            .Select(item => new BranchAppointmentDoctorResponse
            {
                Uuid = item.Uuid,
                Name = item.Name
            })
            .ToListAsync(cancellationToken);
        var services = await (
            from assignment in dbContext.HospitalMedicalServices
            join service in dbContext.MedicalServices
                on assignment.MedicalServiceUuid equals service.Uuid
            where assignment.HospitalUuid == hospitalUuid &&
                service.Status == BaseStatus.Active &&
                service.DeletedAt == null
            select new BranchAppointmentMedicalServiceResponse
            {
                Uuid = service.Uuid,
                Name = service.Name,
                Price = service.Price
            }).ToListAsync(cancellationToken);
        var timeWorkings = await dbContext.TimeWorkings
            .Where(item => item.Status == BaseStatus.Active && item.DeletedAt == null)
            .Select(item => new BranchAppointmentWorkingResponse
            {
                Uuid = item.Uuid,
                DayOfWeek = item.DayOfWeek,
                StartTime = item.StartTime.ToString(),
                EndTime = item.EndTime.ToString()
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            message = "Fetched successfully",
            data = new BranchAppointmentResourcesResponse
            {
                Rooms = rooms,
                Doctors = doctors,
                Services = services,
                TimeWorkings = timeWorkings
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetAppointments(
        Guid hospitalUuid,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] AppointmentStatus? status = null,
        [FromQuery] AppointmentType? type = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 100,
        CancellationToken cancellationToken = default)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return NotFound(new { message = "Hospital not found", error = "Resource does not exist" });

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = dbContext.Appointments
            .Where(item => item.HospitalUuid == hospitalUuid && item.DeletedAt == null);
        if (from.HasValue)
            query = query.Where(item => item.AppointmentDate >= from.Value.Date);
        if (to.HasValue)
            query = query.Where(item => item.AppointmentDate < to.Value.Date.AddDays(1));
        if (status.HasValue)
            query = query.Where(item => item.Status == status.Value);
        if (type.HasValue)
            query = query.Where(item => item.Type == type.Value);

        var appointments = await query
            .OrderBy(item => item.AppointmentDate)
            .ThenBy(item => item.TimeSlot)
            .ToListAsync(cancellationToken);
        var items = await ToResponses(appointments, cancellationToken);
        var normalizedSearch = search?.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedSearch))
        {
            items = items.Where(item =>
                item.PatientName.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                item.MedicalCode.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ||
                (item.DoctorName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (item.RoomName?.Contains(normalizedSearch, StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();
        }

        var totalCount = items.Count;
        return Ok(new
        {
            message = "Fetched successfully",
            data = items.Skip((page - 1) * pageSize).Take(pageSize),
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            }
        });
    }

    [HttpPut("{appointmentUuid:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid hospitalUuid,
        Guid appointmentUuid,
        BranchAppointmentStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Status is not AppointmentStatus.Approved
            and not AppointmentStatus.Unconfirmed
            and not AppointmentStatus.CheckedIn
            and not AppointmentStatus.Cancelled)
            return BadRequest(new { message = "Requested appointment status is not supported" });
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        var validTransition = appointment.Status switch
        {
            AppointmentStatus.Pending => request.Status is AppointmentStatus.Approved
                or AppointmentStatus.Unconfirmed or AppointmentStatus.Cancelled,
            AppointmentStatus.Approved => request.Status is AppointmentStatus.CheckedIn
                or AppointmentStatus.Cancelled,
            _ => false
        };
        if (!validTransition)
            return Conflict(new { message = "Appointment status transition is not allowed", error = "INVALID_APPOINTMENT_STATE" });

        appointment.Status = request.Status;
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Updated successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPut("{appointmentUuid:guid}/assignment")]
    public async Task<IActionResult> AssignResources(
        Guid hospitalUuid,
        Guid appointmentUuid,
        BranchAppointmentAssignmentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status is not AppointmentStatus.Pending and not AppointmentStatus.Approved)
            return Conflict(new { message = "Only pending or approved appointments can be assigned", error = "INVALID_APPOINTMENT_STATE" });

        if (request.DoctorUuid.HasValue)
        {
            var doctor = await dbContext.DoctorProfiles.FirstOrDefaultAsync(item =>
                item.Uuid == request.DoctorUuid.Value &&
                item.HospitalUuid == hospitalUuid &&
                item.DeletedAt == null &&
                (!item.AccountUuid.HasValue || dbContext.Accounts.Any(account =>
                    account.Uuid == item.AccountUuid.Value &&
                    account.Status == BaseStatus.Active &&
                    account.DeletedAt == null)), cancellationToken);
            if (doctor is null)
                return BadRequest(new { message = "Doctor does not belong to this branch or is inactive", error = "DOCTOR_NOT_AVAILABLE" });

            var working = await dbContext.TimeWorkings.FirstOrDefaultAsync(item =>
                item.Uuid == appointment.TimeSlot &&
                item.Status == BaseStatus.Active &&
                item.DeletedAt == null &&
                item.DayOfWeek == (int)appointment.AppointmentDate.DayOfWeek, cancellationToken);
            var doctorWorks = working is not null && await dbContext.DoctorWorkings.AnyAsync(item =>
                item.DoctorUuid == doctor.Uuid && item.WorkingUuid == working.Uuid, cancellationToken);
            if (!doctorWorks)
                return Conflict(new { message = "Doctor is not scheduled for this time slot", error = "DOCTOR_NOT_SCHEDULED" });

            var hasDoctorConflict = await dbContext.Appointments.AnyAsync(item =>
                item.Uuid != appointment.Uuid &&
                item.HospitalUuid == hospitalUuid &&
                item.DoctorUuid == doctor.Uuid &&
                item.AppointmentDate == appointment.AppointmentDate &&
                item.TimeSlot == appointment.TimeSlot &&
                item.DeletedAt == null &&
                (item.Status == AppointmentStatus.Pending ||
                 item.Status == AppointmentStatus.Approved ||
                 item.Status == AppointmentStatus.CheckedIn),
                cancellationToken);
            if (hasDoctorConflict)
                return Conflict(new { message = "Doctor already has an appointment for this time slot", error = "DOCTOR_SLOT_TAKEN" });
        }

        if (request.RoomUuid.HasValue)
        {
            var room = await dbContext.Rooms.FirstOrDefaultAsync(item =>
                item.Uuid == request.RoomUuid.Value &&
                item.HospitalUuid == hospitalUuid &&
                item.DeletedAt == null &&
                item.Status == RoomStatus.Available, cancellationToken);
            if (room is null)
                return BadRequest(new { message = "Room is not available in this branch", error = "ROOM_NOT_AVAILABLE" });

            var hasRoomConflict = await dbContext.Appointments.AnyAsync(item =>
                item.Uuid != appointment.Uuid &&
                item.HospitalUuid == hospitalUuid &&
                item.RoomUuid == room.Uuid &&
                item.AppointmentDate == appointment.AppointmentDate &&
                item.TimeSlot == appointment.TimeSlot &&
                item.DeletedAt == null &&
                (item.Status == AppointmentStatus.Pending ||
                 item.Status == AppointmentStatus.Approved ||
                 item.Status == AppointmentStatus.CheckedIn),
                cancellationToken);
            if (hasRoomConflict)
                return Conflict(new { message = "Room already has an appointment for this time slot", error = "ROOM_SLOT_TAKEN" });
        }

        appointment.DoctorUuid = request.DoctorUuid;
        appointment.RoomUuid = request.RoomUuid;
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Resources assigned successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPut("{appointmentUuid:guid}/payment")]
    public async Task<IActionResult> UpdatePayment(
        Guid hospitalUuid,
        Guid appointmentUuid,
        BranchAppointmentPaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status is not AppointmentStatus.Approved and not AppointmentStatus.CheckedIn)
            return Conflict(new { message = "Payment can only be updated for approved or checked-in appointments", error = "INVALID_APPOINTMENT_STATE" });

        appointment.IsPaid = request.IsPaid;
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Payment updated successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPut("{appointmentUuid:guid}/note")]
    public async Task<IActionResult> UpdateDoctorNote(
        Guid hospitalUuid,
        Guid appointmentUuid,
        BranchAppointmentNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status is AppointmentStatus.Done or AppointmentStatus.Cancelled or AppointmentStatus.Unconfirmed)
            return Conflict(new { message = "Notes cannot be changed for a completed or cancelled appointment", error = "INVALID_APPOINTMENT_STATE" });

        appointment.DoctorNote = request.DoctorNote.Trim();
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Doctor note updated successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPost("{appointmentUuid:guid}/services")]
    public async Task<IActionResult> AddService(
        Guid hospitalUuid,
        Guid appointmentUuid,
        CreateAppointmentServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status is not AppointmentStatus.Approved and not AppointmentStatus.CheckedIn)
            return Conflict(new { message = "Services can only be added to approved or checked-in appointments", error = "INVALID_APPOINTMENT_STATE" });

        var service = await dbContext.MedicalServices.FirstOrDefaultAsync(item =>
            item.Uuid == request.MedicalServiceUuid &&
            item.Status == BaseStatus.Active &&
            item.DeletedAt == null &&
            dbContext.HospitalMedicalServices.Any(assignment =>
                assignment.HospitalUuid == hospitalUuid &&
                assignment.MedicalServiceUuid == item.Uuid), cancellationToken);
        if (service is null)
            return BadRequest(new { message = "Service is not available in this branch", error = "SERVICE_NOT_AVAILABLE" });

        var detail = new AppointmentMedicalService
        {
            Uuid = Guid.NewGuid(),
            AppointmentUuid = appointment.Uuid,
            MedicalServiceUuid = service.Uuid,
            Price = service.Price,
            Description = request.Description.Trim(),
            Status = AppointmentMedicalServiceStatus.InProgress
        };
        dbContext.AppointmentMedicalServices.Add(detail);
        appointment.TotalPrice += detail.Price;
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Service added successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPut("{appointmentUuid:guid}/services/{detailUuid:guid}/complete")]
    public async Task<IActionResult> CompleteService(
        Guid hospitalUuid,
        Guid appointmentUuid,
        Guid detailUuid,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status is not AppointmentStatus.Approved and not AppointmentStatus.CheckedIn)
            return Conflict(new { message = "Services can only be completed for approved or checked-in appointments", error = "INVALID_APPOINTMENT_STATE" });
        var detail = await dbContext.AppointmentMedicalServices.FirstOrDefaultAsync(item =>
            item.Uuid == detailUuid && item.AppointmentUuid == appointmentUuid, cancellationToken);
        if (detail is null)
            return NotFound(new { message = "Appointment service not found", error = "Resource does not exist" });

        detail.Status = AppointmentMedicalServiceStatus.Completed;
        appointment.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Service completed successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    [HttpPut("{appointmentUuid:guid}/complete")]
    public async Task<IActionResult> CompleteAppointment(
        Guid hospitalUuid,
        Guid appointmentUuid,
        BranchAppointmentNoteRequest request,
        CancellationToken cancellationToken = default)
    {
        var appointment = await FindAppointment(hospitalUuid, appointmentUuid, cancellationToken);
        if (appointment is null)
            return NotFound(new { message = "Appointment not found", error = "Resource does not exist" });
        if (appointment.Status != AppointmentStatus.CheckedIn)
            return Conflict(new { message = "Only checked-in appointments can be completed", error = "INVALID_APPOINTMENT_STATE" });
        if (!appointment.IsPaid)
            return Conflict(new { message = "Appointment must be paid before completion", error = "PAYMENT_REQUIRED" });
        if (await dbContext.AppointmentMedicalServices.AnyAsync(item =>
            item.AppointmentUuid == appointmentUuid &&
            item.Status != AppointmentMedicalServiceStatus.Completed, cancellationToken))
            return Conflict(new { message = "All additional services must be completed first", error = "SERVICES_INCOMPLETE" });

        appointment.Status = AppointmentStatus.Done;
        appointment.DoctorNote = request.DoctorNote.Trim();
        appointment.UpdatedAt = DateTime.UtcNow;
        if (appointment.RoomUuid.HasValue)
        {
            var roomHasOtherActiveAppointment = await dbContext.Appointments.AnyAsync(item =>
                item.Uuid != appointment.Uuid &&
                item.HospitalUuid == hospitalUuid &&
                item.RoomUuid == appointment.RoomUuid &&
                item.DeletedAt == null &&
                (item.Status == AppointmentStatus.Pending ||
                 item.Status == AppointmentStatus.Approved ||
                 item.Status == AppointmentStatus.CheckedIn),
                cancellationToken);
            if (!roomHasOtherActiveAppointment)
            {
                var room = await dbContext.Rooms.FirstOrDefaultAsync(item =>
                    item.Uuid == appointment.RoomUuid &&
                    item.HospitalUuid == hospitalUuid &&
                    item.Status == RoomStatus.Occupied, cancellationToken);
                if (room is not null)
                {
                    room.Status = RoomStatus.Available;
                    room.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Appointment completed successfully", data = await ToResponse(appointment, cancellationToken) });
    }

    private async Task<Appointment?> FindAppointment(
        Guid hospitalUuid,
        Guid appointmentUuid,
        CancellationToken cancellationToken)
    {
        if (!await HasBranchAccess(hospitalUuid, cancellationToken))
            return null;
        return await dbContext.Appointments.FirstOrDefaultAsync(item =>
            item.Uuid == appointmentUuid &&
            item.HospitalUuid == hospitalUuid &&
            item.DeletedAt == null, cancellationToken);
    }

    private async Task<bool> HasBranchAccess(Guid hospitalUuid, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(User.FindFirstValue("uuid"), out var accountUuid))
            return false;
        return await dbContext.Accounts.AnyAsync(account =>
            account.Uuid == accountUuid &&
            account.HospitalUuid == hospitalUuid &&
            account.Status == BaseStatus.Active &&
            account.DeletedAt == null &&
            account.RoleUuid.HasValue &&
            dbContext.Roles.Any(role =>
                role.Uuid == account.RoleUuid.Value &&
                role.Status == BaseStatus.Active &&
                role.DeletedAt == null &&
                (role.Name.ToLower().Contains("admin") ||
                 role.Name.ToLower().Contains("quản trị") ||
                 role.Name.ToLower().Contains("staff") ||
                 role.Name.ToLower().Contains("tiếp nhận") ||
                 role.Name.ToLower().Contains("warehouse") ||
                 role.Name.ToLower().Contains("kho"))), cancellationToken);
    }

    private async Task<List<BranchAppointmentResponse>> ToResponses(
        List<Appointment> appointments,
        CancellationToken cancellationToken)
    {
        var result = new List<BranchAppointmentResponse>(appointments.Count);
        foreach (var appointment in appointments)
            result.Add(await ToResponse(appointment, cancellationToken));
        return result;
    }

    private async Task<BranchAppointmentResponse> ToResponse(
        Appointment appointment,
        CancellationToken cancellationToken)
    {
        var working = appointment.TimeSlot.HasValue
            ? await dbContext.TimeWorkings.FirstOrDefaultAsync(item =>
                item.Uuid == appointment.TimeSlot.Value, cancellationToken)
            : null;
        var doctor = appointment.DoctorUuid.HasValue
            ? await dbContext.DoctorProfiles.FirstOrDefaultAsync(item =>
                item.Uuid == appointment.DoctorUuid.Value, cancellationToken)
            : null;
        var room = appointment.RoomUuid.HasValue
            ? await dbContext.Rooms.FirstOrDefaultAsync(item =>
                item.Uuid == appointment.RoomUuid.Value, cancellationToken)
            : null;
        var service = appointment.MedicalServiceUuid.HasValue
            ? await dbContext.MedicalServices.FirstOrDefaultAsync(item =>
                item.Uuid == appointment.MedicalServiceUuid.Value, cancellationToken)
            : null;
        var serviceDetails = await (
            from detail in dbContext.AppointmentMedicalServices
            join medicalService in dbContext.MedicalServices
                on detail.MedicalServiceUuid equals medicalService.Uuid into joined
            from medicalService in joined.DefaultIfEmpty()
            where detail.AppointmentUuid == appointment.Uuid
            select new BranchAppointmentServiceResponse
            {
                Uuid = detail.Uuid,
                MedicalServiceUuid = detail.MedicalServiceUuid,
                Name = medicalService == null ? "Dịch vụ" : medicalService.Name,
                Price = detail.Price,
                Description = detail.Description,
                Status = detail.Status.ToString()
            }).ToListAsync(cancellationToken);

        return new BranchAppointmentResponse
        {
            Uuid = appointment.Uuid,
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentDate = appointment.AppointmentDate,
            TimeSlot = appointment.TimeSlot,
            Time = working is null ? string.Empty : $"{working.StartTime:HH\\:mm} - {working.EndTime:HH\\:mm}",
            Type = appointment.Type.ToString(),
            Status = appointment.Status.ToString(),
            PatientUuid = appointment.PatientUuid,
            HospitalUuid = appointment.HospitalUuid,
            DoctorUuid = appointment.DoctorUuid,
            DoctorName = doctor?.Name,
            MedicalServiceUuid = appointment.MedicalServiceUuid,
            MedicalServiceName = service?.Name,
            RoomUuid = appointment.RoomUuid,
            RoomName = room?.Name,
            DoctorNote = appointment.DoctorNote,
            TotalPrice = appointment.TotalPrice,
            IsPaid = appointment.IsPaid,
            IsWalkIn = appointment.PatientUuid == null,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt,
            Services = serviceDetails
        };
    }
}
