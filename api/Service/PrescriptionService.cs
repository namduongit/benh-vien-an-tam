using api.Contract.Prescription;
using api.Lib;
using api.Model.Enum;
using api.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public class PrescriptionService : IPrescriptionService
{
	private readonly DBContext _context;

	public PrescriptionService(DBContext context)
	{
		_context = context;
	}

	public async Task<PrescriptionMetricsResponse> GetMetricsAsync(Guid doctorUuid, DateTime targetDate)
	{
		var startOfMonth = new DateTime(targetDate.Year, targetDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
		var endOfMonth = startOfMonth.AddMonths(1).AddTicks(-1);

		var startOfLastMonth = startOfMonth.AddMonths(-1);
		var endOfLastMonth = startOfMonth.AddTicks(-1);

		var baseQuery = _context.Prescriptions
			.Where(p => p.DoctorProfileUuid == doctorUuid && p.DeletedAt == null);

		var monthlyCount = await baseQuery.CountAsync(p => p.CreatedAt >= startOfMonth && p.CreatedAt <= endOfMonth);
		var lastMonthCount = await baseQuery.CountAsync(p => p.CreatedAt >= startOfLastMonth && p.CreatedAt <= endOfLastMonth);

		var statusCounts = await baseQuery
			.Where(p => p.CreatedAt >= startOfMonth && p.CreatedAt <= endOfMonth)
			.GroupBy(p => p.Status)
			.Select(g => new { Status = g.Key, Count = g.Count() })
			.ToDictionaryAsync(g => g.Status, g => g.Count);

		return new PrescriptionMetricsResponse
		{
			MonthlyCount = monthlyCount,
			MonthlyDiffFromLastMonth = monthlyCount - lastMonthCount,
			UnpaidCount = statusCounts.GetValueOrDefault(PrescriptionStatus.Unpaid, 0),
			PaidCount = statusCounts.GetValueOrDefault(PrescriptionStatus.Paid, 0),
			CancelledCount = statusCounts.GetValueOrDefault(PrescriptionStatus.Cancelled, 0)
		};
	}

	public async Task<PagedResponse<PrescriptionListResponse>> GetListAsync(Guid doctorUuid, PrescriptionQuery query)
	{
		// Sử dụng LINQ Join để kết nối Prescription và PatientProfile
		var q = from p in _context.Prescriptions
				join pat in _context.PatientProfiles on p.PatientProfileUuid equals pat.Uuid
				where p.DoctorProfileUuid == doctorUuid && p.DeletedAt == null
				select new { p, pat };

		if (query.Date.HasValue)
		{
			var date = query.Date.Value.Date.ToUniversalTime();
			var nextDate = date.AddDays(1);
			q = q.Where(x => x.p.CreatedAt >= date && x.p.CreatedAt < nextDate);
		}

		if (query.Status.HasValue)
		{
			q = q.Where(x => x.p.Status == query.Status.Value);
		}

		if (!string.IsNullOrWhiteSpace(query.Search))
		{
			var search = query.Search.ToLower().Trim();
			q = q.Where(x => x.pat.Name.ToLower().Contains(search) ||
							 x.pat.MedicalCode.ToLower().Contains(search) ||
							 x.p.Uuid.ToString().Contains(search));
		}

		var totalItems = await q.CountAsync();

		var prescriptionsList = await q
			.OrderByDescending(x => x.p.CreatedAt)
			.Skip((query.Page - 1) * query.PageSize)
			.Take(query.PageSize)
			.ToListAsync();

		var resultItems = new List<PrescriptionListResponse>();

		// Lặp qua để lấy chi tiết thuốc tính tổng tiền
		foreach (var item in prescriptionsList)
		{
			var details = await _context.PrescriptionDetails
				.Where(pd => pd.PrescriptionUuid == item.p.Uuid)
				.ToListAsync();

			resultItems.Add(new PrescriptionListResponse
			{
				Uuid = item.p.Uuid,
				RxCode = $"RX-{item.p.CreatedAt:ddMMyy}-{item.p.Uuid.ToString()[..4].ToUpper()}",
				PatientName = item.pat.Name,
				PatientMedicalCode = item.pat.MedicalCode,
				CreatedAt = item.p.CreatedAt,
				MedicineCount = details.Count,
				// Tính tổng tiền dựa trên số lượng * đơn giá (bỏ qua thuốc mua ngoài IsExternal = true)
				TotalAmount = details.Where(d => !d.IsExternal).Sum(d => d.Quantity * d.Price),
				Status = item.p.Status.ToString()
			});
		}

		return new PagedResponse<PrescriptionListResponse>
		{
			Items = resultItems,
			TotalItems = totalItems,
			Page = query.Page,
			PageSize = query.PageSize
		};
	}

	public async Task<PrescriptionDetailResponse?> GetDetailAsync(Guid uuid)
	{
		var prescriptionData = await (from p in _context.Prescriptions
									  join pat in _context.PatientProfiles on p.PatientProfileUuid equals pat.Uuid
									  where p.Uuid == uuid && p.DeletedAt == null
									  select new { p, pat }).FirstOrDefaultAsync();

		if (prescriptionData == null) return null;

		var detailItems = await (from pd in _context.PrescriptionDetails
								 join m in _context.Medicines on pd.MedicineUuid equals m.Uuid into medGroup
								 from m in medGroup.DefaultIfEmpty() // Left join phòng trường hợp mất id thuốc
								 where pd.PrescriptionUuid == uuid
								 select new PrescriptionDetailItemResponse
								 {
									 MedicineUuid = pd.MedicineUuid ?? Guid.Empty,
									 MedicineName = m != null ? m.Name : "Thuốc không xác định",
									 Unit = m != null ? m.Unit.ToString() : "Other",
									 Quantity = pd.Quantity,
									 QuantityPerDose = pd.QuantityPerDose,
									 DosesPerDay = pd.DosesPerDay,
									 Duration = pd.Duration,
									 Price = pd.Price,
									 IsExternal = pd.IsExternal,
									 IsInsured = m != null && m.IsInsured,
									 InsuranceCap = m != null ? m.InsuranceCap : 0,
									 Note = pd.Note
								 }).ToListAsync();

		var age = DateTime.UtcNow.Year - prescriptionData.pat.Birthdate.Year;

		return new PrescriptionDetailResponse
		{
			Uuid = prescriptionData.p.Uuid,
			RxCode = $"RX-{prescriptionData.p.CreatedAt:ddMMyy}-{prescriptionData.p.Uuid.ToString()[..4].ToUpper()}",
			CreatedAt = prescriptionData.p.CreatedAt,
			Status = prescriptionData.p.Status.ToString(),
			Note = prescriptionData.p.Note,
			Patient = new PatientInfo
			{
				MedicalCode = prescriptionData.pat.MedicalCode,
				Name = prescriptionData.pat.Name,
				Gender = prescriptionData.pat.Gender.ToString(),
				Birthdate = $"{prescriptionData.pat.Birthdate:dd/MM/yyyy} ({age} tuổi)",
				Email = prescriptionData.pat.Email
			},
			Details = detailItems
		};
	}

	public async Task<bool> CancelAsync(Guid uuid, Guid doctorUuid, CancelPrescriptionRequest request)
	{
		var prescription = await _context.Prescriptions
			.FirstOrDefaultAsync(p => p.Uuid == uuid && p.DoctorProfileUuid == doctorUuid && p.DeletedAt == null);

		// Chỉ cho phép hủy khi đang ở trạng thái Unpaid (Chưa thanh toán)
		if (prescription == null || prescription.Status != PrescriptionStatus.Unpaid)
		{
			return false;
		}

		prescription.Status = PrescriptionStatus.Cancelled;

		// Ghi nối tiếp lý do hủy vào Ghi chú hiện tại
		var cancelNote = $"[ĐÃ HỦY: {request.Reason}]";
		prescription.Note = string.IsNullOrWhiteSpace(prescription.Note)
			? cancelNote
			: $"{prescription.Note} | {cancelNote}";

		prescription.UpdatedAt = DateTime.UtcNow;

		await _context.SaveChangesAsync();
		return true;
	}
}