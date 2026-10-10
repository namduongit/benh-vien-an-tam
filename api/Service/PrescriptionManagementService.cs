using Microsoft.EntityFrameworkCore;
using api.Contract.Clinical;
using api.Lib;
using api.Model;
using api.Model.Enum;
using api.Service.Interfaces;

namespace api.Service;

public class PrescriptionManagementService(DBContext dbContext) : IPrescriptionManagementService
{
    public async Task<ApiResponse<PrescriptionResponse>?> GetPrescriptionAsync(
        Guid appointmentUuid, CancellationToken cancellationToken)
    {
        var prescription = await dbContext.Prescriptions
            .Where(p => p.AppointmentUuid == appointmentUuid && p.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (prescription is null) return null;

        var details = await dbContext.PrescriptionDetails
            .Where(pd => pd.PrescriptionUuid == prescription.Uuid)
            .Join(dbContext.Medicines,
                pd => pd.MedicineUuid,
                m => m.Uuid,
                (pd, m) => new PrescriptionDetailResponse
                {
                    Uuid = pd.Uuid.ToString(),
                    MedicineUuid = m.Uuid.ToString(),
                    MedicineName = m.Name,
                    Unit = m.Unit.ToString(),
                    Quantity = pd.Quantity,
                    QuantityPerDose = pd.QuantityPerDose,
                    DosesPerDay = pd.DosesPerDay,
                    Duration = pd.Duration,
                    Note = pd.Note
                })
            .ToListAsync(cancellationToken);

        var response = new PrescriptionResponse
        {
            Uuid = prescription.Uuid.ToString(),
            Status = prescription.Status.ToString(),
            Note = prescription.Note,
            Details = details
        };

        return ApiResponse<PrescriptionResponse>.Success(response, "Lấy đơn thuốc thành công.");
    }

    public async Task<ApiResponse<PrescriptionResponse>> SavePrescriptionAsync(
        Guid doctorUuid, Guid appointmentUuid, SavePrescriptionRequest request, CancellationToken cancellationToken)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null)
            return ApiResponse<PrescriptionResponse>.Fail("Không tìm thấy ca khám.", 404);

        var existingPrescription = await dbContext.Prescriptions
            .Where(p => p.AppointmentUuid == appointmentUuid && p.DeletedAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        // Nếu đơn thuốc đã thanh toán hoặc đã hủy thì không cho phép chỉnh sửa
        if (existingPrescription is not null && existingPrescription.Status != PrescriptionStatus.Unpaid)
        {
            return ApiResponse<PrescriptionResponse>.Fail("Đơn thuốc đã thanh toán hoặc đã hủy, không thể chỉnh sửa.", 400);
        }

        Prescription prescription;
        if (existingPrescription is null)
        {
            prescription = new Prescription
            {
                Uuid = Guid.NewGuid(),
                AppointmentUuid = appointmentUuid,
                PatientProfileUuid = appointment.PatientUuid,
                DoctorProfileUuid = appointment.DoctorUuid ?? Guid.Empty,
                HospitalUuid = appointment.HospitalUuid,
                Status = PrescriptionStatus.Unpaid,
                Note = request.Note ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.Prescriptions.Add(prescription);
        }
        else
        {
            prescription = existingPrescription;
            prescription.Note = request.Note ?? string.Empty;
            prescription.UpdatedAt = DateTime.UtcNow;

            var oldDetails = await dbContext.PrescriptionDetails
                .Where(pd => pd.PrescriptionUuid == prescription.Uuid)
                .ToListAsync(cancellationToken);
            dbContext.PrescriptionDetails.RemoveRange(oldDetails);
        }

        foreach (var item in request.Items)
        {
            if (!Guid.TryParse(item.MedicineUuid, out var medUuid)) continue;

            var medicine = await dbContext.Medicines.FindAsync([medUuid], cancellationToken);
            var detail = new PrescriptionDetail
            {
                Uuid = Guid.NewGuid(),
                PrescriptionUuid = prescription.Uuid,
                MedicineUuid = medUuid,
                Quantity = item.Quantity,
                QuantityPerDose = item.QuantityPerDose,
                DosesPerDay = item.DosesPerDay,
                Duration = item.Duration,
                Price = medicine?.Price ?? 0,
                IsExternal = false,
                Note = item.Note
            };
            dbContext.PrescriptionDetails.Add(detail);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetPrescriptionAsync(appointmentUuid, cancellationToken)
               ?? ApiResponse<PrescriptionResponse>.Fail("Lưu đơn thuốc thất bại.", 500);
    }
}