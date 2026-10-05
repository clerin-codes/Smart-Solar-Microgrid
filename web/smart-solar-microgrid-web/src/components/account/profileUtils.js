/**
 * Presentation and client-side validation helpers
 * for the account profile page.
 *
 * The API remains authoritative for validation.
 */
export function getProfileInitials(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatProfileDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  });
}

export function validateProfileForm(form) {
  const errors = {};

  const fullName = form.fullName.trim();

  const email = form.email.trim();

  const phone = form.phoneNumber.trim().replace(/[\s-]/g, "");

  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length < 2) {
    errors.fullName = "Full name is too short.";
  } else if (!/^[\p{L}\p{M} .'-]+$/u.test(fullName)) {
    errors.fullName = "Enter a valid full name.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!phone) {
    errors.phoneNumber = "Mobile number is required.";
  } else if (!/^(?:\+94|0)7\d{8}$/.test(phone)) {
    errors.phoneNumber = "Enter a valid Sri Lankan mobile number.";
  }

  return errors;
}

export function validateChangePasswordForm(form) {
  const errors = {};

  if (!form.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!form.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (form.newPassword.length < 12) {
    errors.newPassword = "Use at least 12 characters.";
  } else if (!/[A-Z]/.test(form.newPassword)) {
    errors.newPassword = "Include at least one uppercase letter.";
  } else if (!/[a-z]/.test(form.newPassword)) {
    errors.newPassword = "Include at least one lowercase letter.";
  } else if (!/\d/.test(form.newPassword)) {
    errors.newPassword = "Include at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(form.newPassword)) {
    errors.newPassword = "Include at least one special character.";
  } else if (form.newPassword !== form.newPassword.trim()) {
    errors.newPassword = "Password cannot begin or end with spaces.";
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword =
      "New password must be different from the current password.";
  }

  if (!form.confirmNewPassword) {
    errors.confirmNewPassword = "Confirm your new password.";
  } else if (form.confirmNewPassword !== form.newPassword) {
    errors.confirmNewPassword = "Passwords do not match.";
  }

  return errors;
}
