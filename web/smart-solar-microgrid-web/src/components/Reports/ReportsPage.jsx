import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFetch } from '../../hooks/useFetch'
import { useStationLookup } from '../../hooks/useStationLookup'
import { reservationService } from '../../services/reservationService'
import { slotService } from '../../services/stationService'
import { countByStatus, defaultRange, filterByRange, perDay, perStation, summarise } from '../../utils/analytics'
import { downloadCsv, errorMessage, formatKw } from '../../utils/formatters'
import { exportReportPdf } from '../../utils/pdf'
import {
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  PageHeader,
  Spinner,
  Stat,
  Table,
  inputClass,
} from '../Common/ui'

const STATUS_COLORS = {
  Pending: '#f59e0b',
  Approved: '#3b82f6',
  Rejected: '#ef4444',
  Cancelled: '#9ca3af',
  Completed: '#22c55e',
}

function ChartCard({ title, children }) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-gray-700">{title}</h2>
      <div className="h-64">{children}</div>
    </Card>
  )
}

export default function ReportsPage() {
  const reservations = useFetch(reservationService.getAll)
  const slots = useFetch(slotService.getAll)
  const stations = useStationLookup()
  const [{ from, to }, setRange] = useState(defaultRange)
  const [exporting, setExporting] = useState(false)

  const slotById = useMemo(() => Object.fromEntries((slots.data ?? []).map((s) => [s.id, s])), [slots.data])
  const capacityOf = (r) => slotById[r.slotId]?.capacityKw

  const inRange = useMemo(() => filterByRange(reservations.data ?? [], from, to), [reservations.data, from, to])
  const summary = summarise(inRange, capacityOf)
  const byStatus = countByStatus(inRange)
  const daily = perDay(inRange, from, to)
  const stationRows = perStation(inRange, stations.nameOf, capacityOf)

  const loading = reservations.loading || slots.loading
  const error = reservations.error || slots.error

  const exportCsv = () =>
    downloadCsv('station-performance.csv', [
      ['Station', 'Reservations', 'Completed', 'Capacity transferred (kW)'],
      ...stationRows.map((s) => [s.station, s.reservations, s.completed, s.capacityKw]),
    ])

  const exportPdf = async () => {
    setExporting(true)
    try {
      await exportReportPdf({
        title: 'SunChain Energy Trading Report',
        subtitle: `Reservation dates ${from || 'start'} to ${to || 'today'}`,
        filename: `sunchain-report-${from}-to-${to}.pdf`,
        kpis: [
          ['Total reservations', summary.total],
          ['Completed transfers', summary.completed],
          ['Completion rate', `${summary.completionRate}%`],
          ['Cancellation rate', `${summary.cancellationRate}%`],
          ['Slot capacity transferred', formatKw(summary.capacityKw)],
        ],
        sections: [
          { title: 'Reservations by status', head: ['Status', 'Count'], rows: byStatus.map((s) => [s.status, s.count]) },
          {
            title: 'Station performance',
            head: ['Station', 'Reservations', 'Completed', 'Capacity transferred (kW)'],
            rows: stationRows.map((s) => [s.station, s.reservations, s.completed, s.capacityKw]),
          },
        ],
      })
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the PDF.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Energy trading activity over a date range"
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={stationRows.length === 0}>
              Export CSV
            </Button>
            <Button onClick={exportPdf} disabled={loading || exporting}>
              {exporting ? 'Creating PDF...' : 'Export PDF'}
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-600">Reservation date from</span>
        <input type="date" value={from} max={to} onChange={(e) => setRange({ from: e.target.value, to })} className={`${inputClass} max-w-40`} />
        <span className="text-gray-600">to</span>
        <input type="date" value={to} min={from} onChange={(e) => setRange({ from, to: e.target.value })} className={`${inputClass} max-w-40`} />
      </div>

      {loading && <Spinner />}
      <ErrorMessage message={error} onRetry={() => { reservations.reload(); slots.reload() }} />

      {!loading && !error && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Reservations" value={summary.total} />
            <Stat label="Completed transfers" value={summary.completed} tone="text-green-600" />
            <Stat label="Completion rate" value={`${summary.completionRate}%`} tone="text-green-600" />
            <Stat label="Cancellation rate" value={`${summary.cancellationRate}%`} />
            <Stat label="Capacity transferred" value={formatKw(summary.capacityKw)} tone="text-blue-600" />
          </div>

          {summary.total === 0 ? (
            <div className="mt-6">
              <EmptyState title="No reservations in this date range" hint="Widen the dates to see activity." />
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <ChartCard title="Reservations by status">
                  <ResponsiveContainer>
                    <BarChart data={byStatus}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Reservations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Reservations per day">
                  <ResponsiveContainer>
                    <BarChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="requested" name="Requested" fill={STATUS_COLORS.Approved} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill={STATUS_COLORS.Completed} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <h2 className="mt-8 mb-3 text-lg font-semibold">Station performance</h2>
              <Table headers={['Station', 'Reservations', 'Completed', 'Capacity transferred']}>
                {stationRows.map((s) => (
                  <tr key={s.station}>
                    <td className="px-4 py-3 font-medium">{s.station}</td>
                    <td className="px-4 py-3">{s.reservations}</td>
                    <td className="px-4 py-3">{s.completed}</td>
                    <td className="px-4 py-3">{formatKw(s.capacityKw)}</td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </>
      )}
    </>
  )
}
