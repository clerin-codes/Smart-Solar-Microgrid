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

/** Normalizes numeric or string role values returned by the API. */
export function normalizeRole(role) {
  if (typeof role === "number") {
    return ROLE_BY_NUMBER[role] ?? String(role);
  }

  if (typeof role === "string" && /^\d+$/.test(role)) {
    return ROLE_BY_NUMBER[Number(role)] ?? role;
  }

  return role ?? "";
}

/** Normalizes numeric or string account-status values returned by the API. */
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

  if (normalized === "GridOperator") {
    return "Grid Operator";
  }

  if (normalized === "Prosumer") {
    return "Solar Prosumer";
  }

  return normalized || "Unknown";
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
