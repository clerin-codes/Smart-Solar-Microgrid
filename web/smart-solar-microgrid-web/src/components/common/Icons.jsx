function BaseIcon({
  children,
  className = 'h-5 w-5',
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function DashboardIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
    </BaseIcon>
  )
}

export function UsersIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle
        cx="9"
        cy="7"
        r="4"
      />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseIcon>
  )
}

export function ClockIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 7v5l3 2" />
    </BaseIcon>
  )
}

export function UserMinusIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle
        cx="8"
        cy="7"
        r="4"
      />
      <path d="M17 11h6" />
    </BaseIcon>
  )
}

export function StationIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z" />
      <circle
        cx="12"
        cy="11"
        r="2.5"
      />
    </BaseIcon>
  )
}

export function SlotsIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
      />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <path d="M8 14h2M14 14h2M8 17h2M14 17h2" />
    </BaseIcon>
  )
}

export function ReservationsIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M8 4h8" />
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
      />
      <path d="m8 13 2 2 5-5" />
    </BaseIcon>
  )
}

export function ProfileIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </BaseIcon>
  )
}

export function MenuIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </BaseIcon>
  )
}

export function ChevronLeftIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </BaseIcon>
  )
}

export function LogoutIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" />
    </BaseIcon>
  )
}

export function SearchIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-4-4" />
    </BaseIcon>
  )
}

export function PlusIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </BaseIcon>
  )
}

export function EditIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20H4v-4z" />
    </BaseIcon>
  )
}

export function CheckIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="m5 12 4 4L19 6" />
    </BaseIcon>
  )
}

export function RefreshIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M20 6v6h-6" />
      <path d="M4 18v-6h6" />
      <path d="M5.5 9a7 7 0 0 1 11.9-2L20 12" />
      <path d="M18.5 15a7 7 0 0 1-11.9 2L4 12" />
    </BaseIcon>
  )
}

export function ShieldIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z" />
      <path d="m9 12 2 2 4-4" />
    </BaseIcon>
  )
}

export function ArrowRightIcon(
  props
) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </BaseIcon>
  )
}