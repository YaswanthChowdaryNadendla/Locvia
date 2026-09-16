// src/utils/validators.js
// Form validation helpers

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(String(phone).replace(/\D/g, ''));

export const isValidPincode = (pincode) =>
  /^\d{6}$/.test(String(pincode));

export const isStrongPassword = (password) =>
  password && password.length >= 6;

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  return errors;
};

export const validateRegisterForm = ({ name, email, password, phone }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  else if (!isStrongPassword(password)) errors.password = 'Password must be at least 6 characters.';
  if (!phone) errors.phone = 'Phone number is required.';
  else if (!isValidPhone(phone)) errors.phone = 'Enter a valid 10-digit phone number.';
  return errors;
};

// Check if an object has no keys (no errors)
export const hasNoErrors = (errors) => Object.keys(errors).length === 0;
