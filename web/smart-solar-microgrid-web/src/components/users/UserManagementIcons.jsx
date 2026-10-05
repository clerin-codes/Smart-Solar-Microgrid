function SvgIcon({
  children,
  className = 'h-5 w-5',
  strokeWidth = '1.9',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
    >
      {children}
    </svg>
  )
}

export function UsersIcon() {
  return (
    <SvgIcon className="h-6 w-6">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </SvgIcon>
  )
}

export function CheckIcon() {
  return (
    <SvgIcon className="h-4 w-4" strokeWidth="2">
      <path d="m5 12 4 4L19 6" />
    </SvgIcon>
  )
}

export function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <SvgIcon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </SvgIcon>
  )
}

export function WarningIcon() {
  return (
    <SvgIcon>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
    </SvgIcon>
  )
}

export function PortalIcon() {
  return (
    <SvgIcon strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </SvgIcon>
  )
}

export function SearchIcon() {
  return (
    <SvgIcon strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </SvgIcon>
  )
}

export function PlusIcon() {
  return (
    <SvgIcon className="h-4 w-4" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </SvgIcon>
  )
}

export function EditIcon() {
  return (
    <SvgIcon className="h-4 w-4">
      <path d="m4 20 4.2-1 10-10a2 2 0 0 0-2.8-2.8l-10 10L4 20Z" />
      <path d="m13.8 7.8 2.4 2.4" />
    </SvgIcon>
  )
}

export function PowerIcon() {
  return (
    <SvgIcon className="h-4 w-4">
      <path d="M12 2v10" />
      <path d="M6.3 5.7a8 8 0 1 0 11.4 0" />
    </SvgIcon>
  )
}

export function ReactivateIcon() {
  return (
    <SvgIcon className="h-4 w-4">
      <path d="M20 6v5h-5" />
      <path d="M18.5 8.5A7 7 0 1 0 19 16" />
    </SvgIcon>
  )
}

export function FilterIcon() {
  return (
    <SvgIcon className="h-4 w-4" strokeWidth="1.8">
      <path d="M4 7h16M7 12h10M10 17h4" />
    </SvgIcon>
  )
}

export function RequestIcon({ className = 'h-5 w-5' }) {
  return (
    <SvgIcon className={className}>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 7v5l3 2" />
      <path d="M17 3h4v4" />
      <path d="m21 3-5 5" />
    </SvgIcon>
  )
}

export function FinalizeIcon() {
  return (
    <SvgIcon className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5" />
      <path d="M12 16h.01" />
    </SvgIcon>
  )
}

export function EmptyIcon() {
  return (
    <SvgIcon strokeWidth="1.8">
      <path d="M5 5h14v14H5z" />
      <path d="m8 12 2.5 2.5L16 9" />
    </SvgIcon>
  )
}
