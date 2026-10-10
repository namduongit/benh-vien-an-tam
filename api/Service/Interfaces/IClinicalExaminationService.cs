using api.Contract.Clinical;
using api.Lib;

namespace api.Service.Interfaces;

public interface IClinicalExaminationService
{
    Task<ApiResponse<ClinicalMedicalServiceResponse>?> AddMedicalServiceAsync(Guid doctorUuid, Guid appointmentUuid, AddMedicalServiceRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<ClinicalMedicalServiceResponse>?> UpdateMedicalServiceAsync(Guid doctorUuid, Guid appointmentUuid, Guid serviceUuid, UpdateMedicalServiceRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<bool>> SaveDiagnosisAsync(Guid doctorUuid, Guid appointmentUuid, SaveDiagnosisRequest request, CancellationToken cancellationToken);
    Task<ApiResponse<List<ClinicalMedicineOptionResponse>>> SearchMedicinesAsync(string? keyword, CancellationToken cancellationToken);
}