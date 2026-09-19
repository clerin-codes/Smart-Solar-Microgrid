import { useMemo } from 'react'
import { stationService } from '../services/stationService'
import { useFetch } from './useFetch'

// Loads all stations once and exposes an id -> station map for display names.
export function useStationLookup() {
  const { data, loading, error, reload } = useFetch(stationService.getAll)
  const byId = useMemo(() => Object.fromEntries((data ?? []).map((s) => [s.id, s])), [data])
  const nameOf = (id) => byId[id]?.stationName ?? 'Unknown station'
  return { stations: data ?? [], byId, nameOf, loading, error, reload }
}
