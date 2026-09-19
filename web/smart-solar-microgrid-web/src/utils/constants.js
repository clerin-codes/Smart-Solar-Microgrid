export const ROLES = {
  BACKOFFICE: 'Backoffice',
  GRID_OPERATOR: 'GridOperator',
  PROSUMER: 'Prosumer',
}

export const ROLE_LABELS = {
  Backoffice: 'Backoffice Admin',
  GridOperator: 'Grid Operator',
  Prosumer: 'Solar Prosumer',
}

// The API serialises enums as numbers; accept either form.
export const RESERVATION_STATUS = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed']
export const SLOT_STATUS = ['Available', 'Full', 'Closed']
export const TRANSACTION_STATUS = ['NotStarted', 'Verified', 'Completed']
export const USER_ROLES = ['Backoffice', 'GridOperator', 'Prosumer']

export const enumName = (names, value) =>
  typeof value === 'number' ? (names[value] ?? String(value)) : value

export const STATUS_STYLES = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Rejected: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-200 text-gray-700',
  Completed: 'bg-green-100 text-green-800',
  Available: 'bg-green-100 text-green-800',
  Full: 'bg-red-100 text-red-800',
  Closed: 'bg-gray-200 text-gray-700',
  NotStarted: 'bg-gray-100 text-gray-600',
  Verified: 'bg-blue-100 text-blue-800',
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-200 text-gray-700',
}
