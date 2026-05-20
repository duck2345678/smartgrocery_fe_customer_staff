export const isEmailValid = (email: string): boolean => /\S+@\S+\.\S+/.test(email.trim());

export const getEmailError = (input: { email: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.email.trim()) return 'Vui lòng nhập email';
  if (!isEmailValid(input.email)) return 'Email không hợp lệ';
  return undefined;
};

export const getPasswordError = (input: { password: string; touched: boolean; focused: boolean }): string | undefined => {
  if (!input.touched || input.focused) return undefined;
  if (!input.password) return 'Vui lòng nhập mật khẩu';
  if (input.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return undefined;
};

export const isLoginFormValid = (input: { email: string; password: string }): boolean =>
  isEmailValid(input.email) && input.password.length >= 6;
