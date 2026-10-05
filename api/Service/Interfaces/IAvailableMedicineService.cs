using api.Contract.AvailableMedicine;
using api.Contract.Common;

namespace api.Service.Interfaces;

public interface IAvailableMedicineService
{
    Task<Guid?> GetHospitalUuidByAccountAsync(Guid accountUuid);
    Task<PagedResultDto<AvailableMedicineItemDto>> GetAvailableMedicinesAsync(Guid hospitalUuid, AvailableMedicineQueryDto query);
    Task<AvailableMedicineDetailDto?> GetMedicineDetailAsync(Guid hospitalUuid, Guid medicineUuid);
    List<object> GetMedicineUnits();
}