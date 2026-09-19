import { LinkButton } from '../Common/ui'

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <LinkButton to="/qr-scanner" variant="info">
        Scan QR code
      </LinkButton>
      <LinkButton to="/transactions" variant="secondary">
        View transactions
      </LinkButton>
      <LinkButton to="/reservations" variant="secondary">
        All reservations
      </LinkButton>
    </div>
  )
}
