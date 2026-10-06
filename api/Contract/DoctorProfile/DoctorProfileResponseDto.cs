namespace api.Contract.DoctorProfile;

public class DoctorProfileResponseDto
{
    public Guid Uuid { get; set; }
    
    // Khối 1: Thông tin bác sĩ (Chỉnh sửa được)
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Workplace { get; set; } = string.Empty;
    public string Introduction { get; set; } = string.Empty;
    public string Expertise { get; set; } = string.Empty;

    // Khối 2: Phân công hiện tại (Chỉ đọc - Readonly)
    public string HospitalName { get; set; } = string.Empty;
    public string DepartmentDisplay { get; set; } = string.Empty;
    public int Price { get; set; }
    public string AccountStatus { get; set; } = string.Empty;
}