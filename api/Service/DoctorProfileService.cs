using api.Contract.DoctorProfile;
using api.Lib;
using api.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace api.Service;

public class DoctorProfileService : IDoctorProfileService
{
    private readonly DBContext _context;

    public DoctorProfileService(DBContext context)
    {
        _context = context;
    }

    public async Task<DoctorProfileResponseDto?> GetProfileByAccountIdAsync(Guid accountUuid, CancellationToken cancellationToken = default)
    {
        return await _context.DoctorProfiles
            .AsNoTracking()
            .Where(dp => dp.AccountUuid == accountUuid)
            .Select(dp => new DoctorProfileResponseDto
            {
                Uuid = dp.Uuid,
                Name = dp.Name,
                Specialty = dp.Specialty,
                Workplace = dp.Workplace,
                Introduction = dp.Introduction,
                Expertise = dp.Expertise,
                Price = dp.Price,
                DepartmentDisplay = dp.DepartmentDisplay,

                // JOIN lấy tên Bệnh viện / Cơ sở
                HospitalName = _context.Hospitals
                    .Where(h => h.Uuid == dp.HospitalUuid)
                    .Select(h => h.Name)
                    .FirstOrDefault() ?? string.Empty,

                // JOIN lấy trạng thái tài khoản
                AccountStatus = _context.Accounts
                    .Where(a => a.Uuid == dp.AccountUuid)
                    .Select(a => a.Status.ToString())
                    .FirstOrDefault() ?? string.Empty
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> UpdateProfileAsync(Guid accountUuid, UpdateDoctorProfileRequestDto request, CancellationToken cancellationToken = default)
    {
        var profile = await _context.DoctorProfiles
            .FirstOrDefaultAsync(dp => dp.AccountUuid == accountUuid, cancellationToken);

        if (profile == null)
        {
            return false;
        }

        // Chỉ cập nhật các trường được phép ở Khối "Thông tin bác sĩ"
        profile.Name = request.Name;
        profile.Specialty = request.Specialty;
        profile.Workplace = request.Workplace;
        profile.Introduction = request.Introduction;
        profile.Expertise = request.Expertise;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}