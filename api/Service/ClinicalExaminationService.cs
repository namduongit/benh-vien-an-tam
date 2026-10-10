using Microsoft.EntityFrameworkCore;
using api.Contract.Clinical;
using api.Model;
using api.Model.Enum;
using api.Service.Interfaces;
using api.Lib;

namespace api.Service;

public class ClinicalExaminationService(DBContext dbContext) : IClinicalExaminationService
{
    public async Task<ClinicalMedicalServiceResponse?> AddMedicalServiceAsync(
        Guid doctorUuid, Guid appointmentUuid, AddMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.MedicalServiceUuid, out var serviceUuid))
            return null;

        var appointmentExists = await dbContext.Appointments
            .AnyAsync(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid, cancellationToken);

        if (!appointmentExists) return null;

        var medicalService = await dbContext.MedicalServices
            .Where(x => x.Uuid == serviceUuid && x.Status == BaseStatus.Active)
            .FirstOrDefaultAsync(cancellationToken);

        if (medicalService is null) return null;

        var appointmentMedicalService = new AppointmentMedicalService
        {
            Uuid = Guid.NewGuid(),
            AppointmentUuid = appointmentUuid,
            MedicalServiceUuid = serviceUuid,
            Price = medicalService.Price,
            Description = string.Empty,
            Status = AppointmentMedicalServiceStatus.InProgress
        };

        dbContext.AppointmentMedicalServices.Add(appointmentMedicalService);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClinicalMedicalServiceResponse
        {
            Uuid = appointmentMedicalService.Uuid.ToString(),
            AppointmentUuid = appointmentMedicalService.AppointmentUuid?.ToString() ?? string.Empty,
            MedicalServiceUuid = appointmentMedicalService.MedicalServiceUuid?.ToString() ?? string.Empty,
            Name = medicalService.Name,
            Price = appointmentMedicalService.Price,
            Description = appointmentMedicalService.Description ?? string.Empty,
            Status = appointmentMedicalService.Status.ToString()
        };
    }

    public async Task<ClinicalMedicalServiceResponse?> UpdateMedicalServiceAsync(
        Guid doctorUuid, Guid appointmentUuid, Guid serviceUuid, UpdateMedicalServiceRequest request, CancellationToken cancellationToken)
    {
        var appointmentExists = await dbContext.Appointments
            .AnyAsync(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid, cancellationToken);

        if (!appointmentExists) return null;

        var appointmentMedicalService = await dbContext.AppointmentMedicalServices
            .Where(x => x.Uuid == serviceUuid && x.AppointmentUuid == appointmentUuid)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointmentMedicalService is null) return null;

        if (!Enum.TryParse<AppointmentMedicalServiceStatus>(request.Status, out var status))
            return null;

        if (status == AppointmentMedicalServiceStatus.Completed && string.IsNullOrWhiteSpace(request.Description))
        {
            return null; // Yêu cầu phải có kết quả trước khi hoàn tất dịch vụ
        }

        appointmentMedicalService.Status = status;
        appointmentMedicalService.Description = request.Description ?? string.Empty;

        dbContext.AppointmentMedicalServices.Update(appointmentMedicalService);
        await dbContext.SaveChangesAsync(cancellationToken);

        var medicalServiceName = await dbContext.MedicalServices
            .Where(m => m.Uuid == appointmentMedicalService.MedicalServiceUuid)
            .Select(m => m.Name)
            .FirstOrDefaultAsync(cancellationToken);

        return new ClinicalMedicalServiceResponse
        {
            Uuid = appointmentMedicalService.Uuid.ToString(),
            AppointmentUuid = appointmentMedicalService.AppointmentUuid?.ToString() ?? string.Empty,
            MedicalServiceUuid = appointmentMedicalService.MedicalServiceUuid?.ToString() ?? string.Empty,
            Name = medicalServiceName ?? string.Empty,
            Price = appointmentMedicalService.Price,
            Description = appointmentMedicalService.Description,
            Status = appointmentMedicalService.Status.ToString()
        };
    }

    public async Task<bool> SaveDiagnosisAsync(
        Guid doctorUuid, Guid appointmentUuid, SaveDiagnosisRequest request, CancellationToken cancellationToken)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null || string.IsNullOrWhiteSpace(request.DoctorNote))
        {
            return false;
        }

        appointment.DoctorNote = request.DoctorNote;
        appointment.UpdatedAt = DateTime.UtcNow;

        dbContext.Appointments.Update(appointment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<List<ClinicalMedicineOptionResponse>> SearchMedicinesAsync(
        string? keyword, CancellationToken cancellationToken)
    {
        var query = dbContext.Medicines
            .Where(x => x.Status == BaseStatus.Active && x.DeletedAt == null);

        if (!string.IsNullOrEmpty(keyword))
        {
            query = query.Where(x => x.Name.Contains(keyword));
        }

        var list = await query
            .Take(10)
            .Select(x => new ClinicalMedicineOptionResponse
            {
                Uuid = x.Uuid.ToString(),
                Name = x.Name,
                Unit = x.Unit.ToString()
            })
            .ToListAsync(cancellationToken);

        return list;
    }
}