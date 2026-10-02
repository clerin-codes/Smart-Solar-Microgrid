const ROLE_BY_NUMBER = {
  0: "Backoffice",
  1: "GridOperator",
  2: "Prosumer",
};

const STATUS_BY_NUMBER = {
  0: "Active",
  1: "PendingActivation",
  2: "DeactivationRequested",
  3: "Deactivated",
};

export function normalizeRole(role) {
  if (typeof role === "number") {
    return ROLE_BY_NUMBER[role] ?? String(role);
  }

  if (typeof role === "string" && /^\d+$/.test(role)) {
    return ROLE_BY_NUMBER[Number(role)] ?? role;
  }

  return role ?? "";
}

export function normalizeStatus(status) {
  if (typeof status === "number") {
    return STATUS_BY_NUMBER[status] ?? String(status);
  }

  if (typeof status === "string" && /^\d+$/.test(status)) {
    return STATUS_BY_NUMBER[Number(status)] ?? status;
  }

  return status ?? "";
}

export function getRoleLabel(role) {
  const normalized = normalizeRole(role);

  switch (normalized) {
    case "Backoffice":
      return "Backoffice";

    case "GridOperator":
      return "Grid Operator";

    case "Prosumer":
      return "Solar Prosumer";

    default:
      return normalized || "Unknown";
  }
}

export function getStatusLabel(status) {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "Active":
      return "Active";

    case "PendingActivation":
      return "Pending Activation";

    case "DeactivationRequested":
      return "Deactivation Requested";

    case "Deactivated":
      return "Deactivated";

    default:
      return normalized || "Unknown";
  }
}

export function getInitials(fullName) {
  if (!fullName) {
    return "U";
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}
