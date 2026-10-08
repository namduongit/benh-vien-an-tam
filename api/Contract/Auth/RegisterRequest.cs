using System.ComponentModel.DataAnnotations;
using api.Model.Enum;

namespace api.Contract.Auth;

public sealed class RegisterRequest
{
    [Required(ErrorMessage = "Họ và tên là bắt buộc")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Họ và tên phải có ít nhất 2 ký tự")]
    public string Name { get; init; } = string.Empty;

    [EnumDataType(typeof(Gender), ErrorMessage = "Giới tính không hợp lệ")]
    public Gender Gender { get; init; } = Gender.Other;

    [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
    public DateOnly? Birthdate { get; init; }

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    [StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại là bắt buộc")]
    [RegularExpression(@"^(?:\+84|0)(?:3|5|7|8|9)\d{8}$", ErrorMessage = "Số điện thoại là số Việt Nam")]
    public string Phone { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu là bắt buộc")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "Mật khẩu có từ 8 đến 128 ký tự")]
    public string Password { get; init; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu xác nhận là bắt buộc")]
    [Compare(nameof(Password), ErrorMessage = "Mật khẩu xác nhận không khớp")]
    public string ConfirmPassword { get; init; } = string.Empty;
}
