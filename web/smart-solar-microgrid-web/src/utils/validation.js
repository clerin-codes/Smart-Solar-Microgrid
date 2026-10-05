const NIC_PATTERN = /^(?:\d{12}|\d{9}[vVxX])$/;

const PHONE_PATTERN = /^(?:\+94|0)7\d{8}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}\s.'-]*$/u;

export function validateNic(value) {
  const nic = value?.trim() ?? "";

  if (!nic) {
    return "NIC is required.";
  }

  if (!NIC_PATTERN.test(nic)) {
    return "Enter a valid Sri Lankan NIC.";
  }

  return "";
}

export function validateFullName(value) {
  const fullName = value?.trim() ?? "";

  if (!fullName) {
    return "Full name is required.";
  }

  if (fullName.length < 2 || fullName.length > 100) {
    return "Full name must contain between 2 and 100 characters.";
  }

  if (!NAME_PATTERN.test(fullName)) {
    return "Full name may contain letters, spaces, apostrophes, periods and hyphens only.";
  }

  return "";
}

export function validateEmail(value) {
  const email = value?.trim() ?? "";

  if (!email) {
    return "Email address is required.";
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validatePhone(value) {
  const phone = value?.trim() ?? "";

  if (!phone) {
    return "Mobile phone number is required.";
  }

  if (!PHONE_PATTERN.test(phone)) {
    return "Enter a valid Sri Lankan mobile number.";
  }

  return "";
}

export function validatePassword(value) {
  const password = value ?? "";

  if (!password) {
    return "Password is required.";
  }

  if (password.length < 12 || password.length > 128) {
    return "Password must contain between 12 and 128 characters.";
  }

  if (/\s/.test(password)) {
    return "Password must not contain whitespace.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain an uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain a lowercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain a number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain a special character.";
  }

  return "";
}
