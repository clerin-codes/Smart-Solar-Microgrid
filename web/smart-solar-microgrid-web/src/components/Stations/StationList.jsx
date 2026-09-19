import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { stationService } from '../../services/stationService'
import { ROLES } from '../../utils/constants'
import { formatKw, mapsLink } from '../../utils/formatters'
import {
  Card,
  EmptyState,
  ErrorMessage,
  LinkButton,
  PageHeader,
  Pagination,
  Spinner,
  StatusBadge,
  inputClass,
} from '../Common/ui'
import StationMap from './StationMap'

const PAGE_SIZE = 6

export default function StationList() {
  const { user } = useAuth()
  const isAdmin = user.role === ROLES.BACKOFFICE
  const { data, loading, error, reload } = useFetch(stationService.getAll)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)

  const filtered = useMemo(
    () =>
      (data ?? []).filter((s) => {
        const text = `${s.stationName} ${s.stationCode}`.toLowerCase()
        if (!text.includes(search.toLowerCase())) return false
        if (status === 'active') return s.isActive
        if (status === 'inactive') return !s.isActive
        return true
      }),
    [data, search, status],
  )
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0]

  return (
    <>
      <PageHeader
        title="Solar Stations"
        subtitle="Browse stations and their energy slots"
        actions={isAdmin && <LinkButton to="/stations/new">+ New station</LinkButton>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by name or code"
          className={`${inputClass} max-w-xs`}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className={`${inputClass} max-w-40`}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <Spinner />}
      <ErrorMessage message={error} onRetry={reload} />
      {data && filtered.length === 0 && <EmptyState title="No stations match your filters" />}

      {filtered.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pageItems.map((s) => (
                <Card
                  key={s.id}
                  className={`cursor-pointer transition hover:border-primary-500 ${selected?.id === s.id ? 'border-primary-500 ring-2 ring-primary-100' : ''}`}
                >
                  <div onClick={() => setSelectedId(s.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-900">{s.stationName}</div>
                        <div className="text-xs text-gray-500">{s.stationCode}</div>
                      </div>
                      <StatusBadge status={s.isActive ? 'Active' : 'Inactive'} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">Capacity</dt>
                        <dd>{formatKw(s.capacityKw)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Battery slots</dt>
                        <dd>
                          {s.availableSlots} / {s.batteryStorageSlots} free
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <Link to={`/stations/${s.id}`} className="font-medium text-primary-700 hover:underline">
                        View details &rarr;
                      </Link>
                      <a
                        href={mapsLink(s.latitude, s.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-500 hover:underline"
                      >
                        Open map
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
          </div>

          {selected && (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <StationMap
                latitude={selected.latitude}
                longitude={selected.longitude}
                name={selected.stationName}
                className="h-80"
              />
              <p className="mt-2 text-center text-sm text-gray-500">{selected.stationName}</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
