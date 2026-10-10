import type { AuthField, LoginRequest, RegisterPatientRequest } from "@/types/auth";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

const phonePattern = /^(?:0|\+84)(?:3|5|7|8|9)\d{8}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(phone: string) {
  return phone.replace(/[\s.-]/g, "");
}

export function validateLogin(values: LoginRequest): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!phonePattern.test(normalizePhone(values.Phone))) {
    errors.Phone = "Nhập số điện thoại Việt Nam hợp lệ.";
  }

  if (!values.Password) {
    errors.Password = "Nhập mật khẩu.";
  }

  return errors;
}

export function validateRegistration(values: RegisterPatientRequest): AuthFieldErrors {
  const errors = validateLogin(values);

  if (values.Password.length < 8) {
    errors.Password = "Mật khẩu phải có ít nhất 8 ký tự.";
  } else if (
    !/[A-Za-z]/.test(values.Password) ||
    !/\d/.test(values.Password)
  ) {
    errors.Password = "Mật khẩu phải có cả chữ và số.";
  }

  if (values.ConfirmPassword !== values.Password) {
    errors.ConfirmPassword = "Mật khẩu nhập lại chưa khớp.";
  }

  if (values.Name.trim().length < 2) {
    errors.Name = "Nhập họ tên có ít nhất 2 ký tự.";
  }

  if (!values.Gender) {
    errors.Gender = "Chọn giới tính.";
  }

  const birthdate = new Date(`${values.Birthdate}T00:00:00`);
  if (
    Number.isNaN(birthdate.getTime()) ||
    birthdate >= new Date(new Date().setHours(0, 0, 0, 0))
  ) {
    errors.Birthdate = "Ngày sinh phải trước ngày hiện tại.";
  }

  if (!emailPattern.test(values.Email.trim())) {
    errors.Email = "Nhập địa chỉ email hợp lệ.";
  }

  return errors;
}
