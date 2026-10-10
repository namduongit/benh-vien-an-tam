using Microsoft.EntityFrameworkCore;
using api.Contract.Clinical;
using api.Lib;
using api.Model.Enum;
using api.Service.Interfaces;

namespace api.Service;

public class DoctorAppointmentService(DBContext dbContext) : IDoctorAppointmentService
{
    public async Task<List<ClinicalAppointmentResponse>> GetAppointmentsAsync(
        Guid doctorUuid, string? date, CancellationToken cancellationToken)
    {
        var query = dbContext.Appointments
            .Where(x => x.DeletedAt == null && x.DoctorUuid == doctorUuid);

        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
        {
            var startOfDay = parsedDate.Date;
            var endOfDay = startOfDay.AddDays(1);
            query = query.Where(x => x.AppointmentDate >= startOfDay && x.AppointmentDate < endOfDay);
        }

        var items = await query
            .OrderBy(x => x.AppointmentDate)
            .Select(x => new ClinicalAppointmentResponse
            {
                Uuid = x.Uuid.ToString(),
                PatientName = x.PatientName,
                Gender = x.Gender.ToString(),
                MedicalCode = x.MedicalCode,
                Note = x.Note,
                AppointmentAt = x.AppointmentDate,
                TypeLabel = x.Type.ToString(),
                RoomName = dbContext.Rooms
                    .Where(r => r.Uuid == x.RoomUuid && r.DeletedAt == null)
                    .Select(r => r.Name)
                    .FirstOrDefault() ?? string.Empty,
                Status = x.Status.ToString(),
                DoctorNote = x.DoctorNote
            })
            .ToListAsync(cancellationToken);

        return items;
    }

    public async Task<ClinicalCaseDetailResponse?> GetAppointmentDetailAsync(
        Guid doctorUuid, Guid appointmentUuid, CancellationToken cancellationToken)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null) return null;

        var medicalServices = await dbContext.AppointmentMedicalServices
            .Where(x => x.AppointmentUuid == appointmentUuid)
            .Join(dbContext.MedicalServices.Where(m => m.Status == BaseStatus.Active),
                ams => ams.MedicalServiceUuid,
                ms => ms.Uuid,
                (ams, ms) => new ClinicalMedicalServiceResponse
                {
                    Uuid = ams.Uuid.ToString(),
                    AppointmentUuid = ams.AppointmentUuid.HasValue ? ams.AppointmentUuid.Value.ToString() : string.Empty,
                    MedicalServiceUuid = ams.MedicalServiceUuid.HasValue ? ams.MedicalServiceUuid.Value.ToString() : string.Empty,
                    Name = ms.Name,
                    Price = ams.Price,
                    Description = ams.Description ?? string.Empty,
                    Status = ams.Status.ToString()
                })
            .ToListAsync(cancellationToken);

        var availableMedicalServices = await dbContext.HospitalMedicalServices
            .Where(x => x.HospitalUuid == appointment.HospitalUuid)
            .Join(dbContext.MedicalServices,
                hms => hms.MedicalServiceUuid,
                ms => ms.Uuid,
                (hms, ms) => new ClinicalServiceOptionResponse
                {
                    Uuid = ms.Uuid.ToString(),
                    Name = ms.Name,
                    Price = ms.Price
                })
            .ToListAsync(cancellationToken);

        var availableMedicines = await dbContext.Medicines
            .Where(x => x.Status == BaseStatus.Active && x.DeletedAt == null)
            .Take(10)
            .Select(x => new ClinicalMedicineOptionResponse
            {
                Uuid = x.Uuid.ToString(),
                Name = x.Name,
                Unit = x.Unit.ToString()
            })
            .ToListAsync(cancellationToken);

        var roomName = await dbContext.Rooms
            .Where(r => r.Uuid == appointment.RoomUuid && r.DeletedAt == null)
            .Select(r => r.Name)
            .FirstOrDefaultAsync(cancellationToken);

        // Lấy thông tin đơn thuốc nếu có
        var prescription = await dbContext.Prescriptions
            .Where(p => p.AppointmentUuid == appointmentUuid && p.DeletedAt == null)
            .Select(p => new PrescriptionResponse
            {
                Uuid = p.Uuid.ToString(),
                Status = p.Status.ToString(),
                Note = p.Note,
                Details = dbContext.PrescriptionDetails
                    .Where(pd => pd.PrescriptionUuid == p.Uuid)
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
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        var response = new ClinicalCaseDetailResponse
        {
            Uuid = appointment.Uuid.ToString(),
            PatientName = appointment.PatientName,
            Gender = appointment.Gender.ToString(),
            MedicalCode = appointment.MedicalCode,
            Note = appointment.Note,
            AppointmentAt = appointment.AppointmentDate,
            TypeLabel = appointment.Type.ToString(),
            RoomName = roomName ?? string.Empty,
            Status = appointment.Status.ToString(),
            DoctorNote = appointment.DoctorNote,
            MedicalServices = medicalServices,
            AvailableMedicalServices = availableMedicalServices,
            AvailableMedicines = availableMedicines,
            Prescription = prescription
        };

        return response;
    }

    /// <summary>
    /// Cập nhật trạng thái ca khám. 
    /// Trả về chuỗi thông báo lỗi (string) nếu thất bại, hoặc null nếu thành công.
    /// </summary>
    public async Task<string?> UpdateAppointmentStatusAsync(
        Guid doctorUuid, Guid appointmentUuid, string newStatus, CancellationToken cancellationToken)
    {
        var appointment = await dbContext.Appointments
            .Where(x => x.Uuid == appointmentUuid && x.DeletedAt == null && x.DoctorUuid == doctorUuid)
            .FirstOrDefaultAsync(cancellationToken);

        if (appointment is null) return "Không tìm thấy ca khám.";

        if (!Enum.TryParse<AppointmentStatus>(newStatus, out var status))
        {
            return "Trạng thái không hợp lệ.";
        }

        // Nghiệp vụ kiểm tra khi hoàn thành ca khám
        if (status == AppointmentStatus.Done)
        {
            if (string.IsNullOrWhiteSpace(appointment.DoctorNote))
            {
                return "Vui lòng nhập thông tin chẩn đoán trước khi hoàn thành ca khám.";
            }

            var services = await dbContext.AppointmentMedicalServices
                .Where(x => x.AppointmentUuid == appointmentUuid)
                .ToListAsync(cancellationToken);

            var allCompleted = services.All(s => s.Status == AppointmentMedicalServiceStatus.Completed && !string.IsNullOrWhiteSpace(s.Description));
            if (!allCompleted)
            {
                return "Tất cả dịch vụ chỉ định phải ở trạng thái hoàn thành và có đầy đủ kết quả.";
            }
        }

        appointment.Status = status;
        appointment.UpdatedAt = DateTime.UtcNow;
        dbContext.Appointments.Update(appointment);
        await dbContext.SaveChangesAsync(cancellationToken);

        return null; // Thành công không có lỗi
    }
}