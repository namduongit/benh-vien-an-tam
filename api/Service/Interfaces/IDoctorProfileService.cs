using api.Contract.DoctorProfile;

namespace api.Service.Interfaces;

public interface IDoctorProfileService
{
    Task<DoctorProfileResponseDto?> GetProfileByAccountIdAsync(Guid accountUuid, CancellationToken cancellationToken = default);
    Task<bool> UpdateProfileAsync(Guid accountUuid, UpdateDoctorProfileRequestDto request, CancellationToken cancellationToken = default);
}