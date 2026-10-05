import {
  getRoleLabel,
  getStatusLabel,
  normalizeStatus,
} from "../../utils/userFormat";

export const ROLE_STYLES = {
  Backoffice: "border-violet-200 bg-violet-100 text-violet-800",
  GridOperator: "border-blue-200 bg-blue-100 text-blue-800",
  Prosumer: "border-cyan-200 bg-cyan-100 text-cyan-800",
};

export const STATUS_STYLES = {
  Active: {
    container: "border-emerald-200 bg-emerald-100",
    dot: "bg-emerald-600",
  },
  PendingActivation: {
    container: "border-amber-200 bg-amber-100",
    dot: "bg-amber-600",
  },
  DeactivationRequested: {
    container: "border-red-200 bg-red-100",
    dot: "bg-red-600",
  },
  Deactivated: {
    container: "border-slate-300 bg-slate-200",
    dot: "bg-slate-600",
  },
};

export { normalizeStatus };

export function prettyStatus(status = "") {
  return getStatusLabel(status);
}

export function roleLabel(role) {
  const label = getRoleLabel(role);
  return label === "Unknown" ? "—" : label;
}

export function getUserInitials(fullName = "") {
  const names = fullName.trim().split(/\s+/).filter(Boolean);

  if (names.length === 0) {
    return "U";
  }

  if (names.length === 1) {
    return names[0].slice(0, 2).toUpperCase();
  }

  return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
}

export function formatDateTimeParts(value) {
  if (!value) {
    return { date: "—", time: "" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function buildVisiblePages(currentPage, totalPages) {
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let start = Math.max(1, currentPage - 2);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = end - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
