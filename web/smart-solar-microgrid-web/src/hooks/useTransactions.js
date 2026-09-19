import { useMemo } from 'react'
import { slotService } from '../services/stationService'
import { transactionService } from '../services/transactionService'
import { useFetch } from './useFetch'
import { useStationLookup } from './useStationLookup'

// Transactions plus what the list/receipt views need to display them (station names, slot capacity).
export function useTransactions() {
  const transactions = useFetch(transactionService.getAll)
  const slots = useFetch(slotService.getAll)
  const stations = useStationLookup()

  const slotById = useMemo(() => Object.fromEntries((slots.data ?? []).map((s) => [s.id, s])), [slots.data])

  return {
    transactions: transactions.data ?? [],
    capacityOf: (r) => slotById[r.slotId]?.capacityKw,
    nameOf: stations.nameOf,
    loading: transactions.loading || slots.loading,
    error: transactions.error || slots.error,
    reload: () => {
      transactions.reload()
      slots.reload()
    },
  }
}
