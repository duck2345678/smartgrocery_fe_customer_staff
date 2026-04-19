import { describe, expect, test } from 'vitest';
import { getEmailError, getPasswordError, isEmailValid, isLoginFormValid } from './loginValidation';

describe('loginValidation', () => {
  test('does not show errors before touched', () => {
    expect(getEmailError({ email: '', touched: false, focused: false })).toBeUndefined();
    expect(getPasswordError({ password: '', touched: false, focused: false })).toBeUndefined();
  });

  test('does not show required errors while focused', () => {
    expect(getEmailError({ email: '', touched: true, focused: true })).toBeUndefined();
    expect(getPasswordError({ password: '', touched: true, focused: true })).toBeUndefined();
  });

  test('shows required errors only after blur (touched + not focused)', () => {
    expect(getEmailError({ email: '', touched: true, focused: false })).toBe('Vui lòng nhập email');
    expect(getPasswordError({ password: '', touched: true, focused: false })).toBe('Vui lòng nhập mật khẩu');
  });

  test('shows invalid email format only after blur', () => {
    expect(getEmailError({ email: 'abc', touched: true, focused: false })).toBe('Email không hợp lệ');
    expect(getEmailError({ email: 'abc', touched: true, focused: true })).toBeUndefined();
  });

  test('shows password min length only after blur', () => {
    expect(getPasswordError({ password: '12345', touched: true, focused: false })).toBe('Mật khẩu phải có ít nhất 6 ký tự');
    expect(getPasswordError({ password: '12345', touched: true, focused: true })).toBeUndefined();
  });

  test('validates email and form validity', () => {
    expect(isEmailValid('a@b.com')).toBe(true);
    expect(isEmailValid('  a@b.com  ')).toBe(true);
    expect(isEmailValid('abc')).toBe(false);

    expect(isLoginFormValid({ email: 'a@b.com', password: '123456' })).toBe(true);
    expect(isLoginFormValid({ email: 'abc', password: '123456' })).toBe(false);
    expect(isLoginFormValid({ email: 'a@b.com', password: '12345' })).toBe(false);
  });

  test('returns no errors when values are valid after blur', () => {
    expect(getEmailError({ email: 'a@b.com', touched: true, focused: false })).toBeUndefined();
    expect(getPasswordError({ password: '123456', touched: true, focused: false })).toBeUndefined();
  });
});
