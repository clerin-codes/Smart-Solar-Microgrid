export const EMPTY_USER_FORM = {
  nic: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  role: "",
};

export function normalizeFieldErrors(errors = {}) {
  const fieldNameMap = {
    nic: "nic",
    fullname: "fullName",
    email: "email",
    phonenumber: "phoneNumber",
    password: "password",
    role: "role",
  };

  return Object.entries(errors).reduce((result, [key, value]) => {
    const normalizedKey = fieldNameMap[key.toLowerCase()] ?? key;
    result[normalizedKey] = Array.isArray(value) ? value[0] : value;
    return result;
  }, {});
}

export function validateUserForm(form, isEdit) {
  const errors = {};

  if (!isEdit) {
    const nic = form.nic.trim().toUpperCase();

    if (!nic) {
      errors.nic = "NIC is required.";
    } else if (!/^\d{12}$/.test(nic) && !/^\d{9}[VX]$/.test(nic)) {
      errors.nic = "Enter a valid Sri Lankan NIC.";
    }

    if (!form.role) {
      errors.role = "Select an account type.";
    }
  }

  const name = form.fullName.trim();
  if (!name) {
    errors.fullName = "Full name is required.";
  } else if (name.length < 2) {
    errors.fullName = "Full name is too short.";
  } else if (name.length > 100) {
    errors.fullName = "Full name is too long.";
  } else if (!/^[\p{L}\p{M} .'-]+$/u.test(name)) {
    errors.fullName = "Full name contains invalid characters.";
  }

  const email = form.email.trim();
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = form.phoneNumber.trim().replace(/[\s-]/g, "");
  if (!phone) {
    errors.phoneNumber = "Mobile number is required.";
  } else if (!/^(?:\+94|0)7\d{8}$/.test(phone)) {
    errors.phoneNumber = "Enter a valid Sri Lankan mobile number.";
  }

  if (!isEdit) {
    const password = form.password;

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 12) {
      errors.password = "Password must contain at least 12 characters.";
    } else if (password.length > 128) {
      errors.password = "Password must not exceed 128 characters.";
    } else if (password !== password.trim()) {
      errors.password = "Password cannot start or end with spaces.";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Include at least one uppercase letter.";
    } else if (!/[a-z]/.test(password)) {
      errors.password = "Include at least one lowercase letter.";
    } else if (!/\d/.test(password)) {
      errors.password = "Include at least one number.";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = "Include at least one special character.";
    }
  }

  return errors;
}

export function buildUserPayload(form, isEdit) {
  if (isEdit) {
    return {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phoneNumber: form.phoneNumber.trim(),
    };
  }

  return {
    nic: form.nic.trim().toUpperCase(),
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phoneNumber: form.phoneNumber.trim(),
    password: form.password,
    role: form.role,
  };
}
