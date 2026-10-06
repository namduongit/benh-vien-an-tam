using System.ComponentModel.DataAnnotations;

namespace api.Contract.DoctorProfile;

public class UpdateDoctorProfileRequestDto
{
    private string _name = string.Empty;
    private string _specialty = string.Empty;
    private string _workplace = string.Empty;
    private string _introduction = string.Empty;
    private string _expertise = string.Empty;

    [Required(ErrorMessage = "Họ và tên không được để trống.", AllowEmptyStrings = false)]
    public string Name
    {
        get => _name;
        set => _name = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "Chuyên môn ngắn không được để trống.", AllowEmptyStrings = false)]
    public string Specialty
    {
        get => _specialty;
        set => _specialty = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "Nơi làm việc không được để trống.", AllowEmptyStrings = false)]
    public string Workplace
    {
        get => _workplace;
        set => _workplace = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "Giới thiệu không được để trống.", AllowEmptyStrings = false)]
    public string Introduction
    {
        get => _introduction;
        set => _introduction = value?.Trim() ?? string.Empty;
    }

    [Required(ErrorMessage = "Kinh nghiệm và chuyên môn không được để trống.", AllowEmptyStrings = false)]
    public string Expertise
    {
        get => _expertise;
        set => _expertise = value?.Trim() ?? string.Empty;
    }
}