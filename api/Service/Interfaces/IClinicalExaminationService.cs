using api.Contract.Clinical;

namespace api.Service.Interfaces;

public interface IClinicalExaminationService
{
    Task<ClinicalMedicalServiceResponse?> AddMedicalServiceAsync(Guid doctorUuid, Guid appointmentUuid, AddMedicalServiceRequest request, CancellationToken cancellationToken);
    Task<ClinicalMedicalServiceResponse?> UpdateMedicalServiceAsync(Guid doctorUuid, Guid appointmentUuid, Guid serviceUuid, UpdateMedicalServiceRequest request, CancellationToken cancellationToken);
    Task<bool> SaveDiagnosisAsync(Guid doctorUuid, Guid appointmentUuid, SaveDiagnosisRequest request, CancellationToken cancellationToken);
    Task<List<ClinicalMedicineOptionResponse>> SearchMedicinesAsync(string? keyword, CancellationToken cancellationToken);
}