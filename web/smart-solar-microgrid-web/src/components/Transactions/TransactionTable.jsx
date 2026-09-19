import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TRANSACTION_STATUS, enumName } from '../../utils/constants'
import { formatDate, formatDateTime, formatKw } from '../../utils/formatters'
import { Pagination, StatusBadge, Table } from '../Common/ui'

const PAGE_SIZE = 10

export default function TransactionTable({ rows, capacityOf, nameOf }) {
  const [page, setPage] = useState(1)
  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)))

  return (
    <>
      <Table headers={['Reservation', 'Prosumer', 'Station', 'Date', 'Capacity', 'Status', 'Completed', '']}>
        {rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE).map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium">{r.reservationNumber}</td>
            <td className="px-4 py-3 font-mono text-xs">{r.prosumerNIC}</td>
            <td className="px-4 py-3">{nameOf(r.stationId)}</td>
            <td className="px-4 py-3">{formatDate(r.reservationDate)}</td>
            <td className="px-4 py-3">{capacityOf(r) != null ? formatKw(capacityOf(r)) : '-'}</td>
            <td className="px-4 py-3">
              <StatusBadge status={enumName(TRANSACTION_STATUS, r.transactionStatus)} />
            </td>
            <td className="px-4 py-3">{r.completedAt ? formatDateTime(r.completedAt) : '-'}</td>
            <td className="px-4 py-3 text-right">
              <Link to={`/transactions/${r.id}`} className="font-medium text-primary-700 hover:underline">
                View
              </Link>
            </td>
          </tr>
        ))}
      </Table>
      <Pagination page={safePage} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
    </>
  )
}
