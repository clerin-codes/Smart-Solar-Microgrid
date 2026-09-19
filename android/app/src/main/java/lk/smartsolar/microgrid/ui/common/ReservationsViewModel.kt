package lk.smartsolar.microgrid.ui.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.ReservationRepository
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.data.repo.SyncManager

data class ListUi(val refreshing: Boolean = false, val error: String? = null, val loaded: Boolean = false)

/**
 * Reservations for the signed-in user (a prosumer's own, or everything for a Grid Operator), read from
 * the local database and refreshed from the server. Also exposes station names and slot capacities
 * for display, so every list screen can share one implementation.
 */
class ReservationsViewModel(
    private val reservations: ReservationRepository,
    stations: StationRepository,
    private val sync: SyncManager,
) : ViewModel() {
    val items: StateFlow<List<ReservationEntity>> =
        reservations.reservations.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val stationList: StateFlow<List<StationEntity>> =
        stations.stations.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val stationNames: StateFlow<Map<String, String>> =
        stations.stations.map { list -> list.associate { it.id to it.name } }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyMap())

    /** slot id to slot capacity in kW */
    val capacities: StateFlow<Map<String, Double>> =
        stations.slots.map { list -> list.associate { it.id to it.capacityKw } }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyMap())

    private val _ui = MutableStateFlow(ListUi())
    val ui: StateFlow<ListUi> = _ui

    private val _events = kotlinx.coroutines.flow.MutableSharedFlow<String>(extraBufferCapacity = 4)
    val events: kotlinx.coroutines.flow.SharedFlow<String> = _events

    private val _approving = MutableStateFlow<String?>(null)
    /** id of the reservation currently being approved, if any */
    val approving: StateFlow<String?> = _approving

    fun approve(id: String) {
        if (_approving.value != null) return
        _approving.value = id
        viewModelScope.launch {
            try {
                reservations.approve(id)
                _events.emit("Reservation approved. QR code generated.")
            } catch (e: AppException) {
                _events.emit(e.message ?: "Could not approve the reservation.")
            } finally {
                _approving.value = null
            }
        }
    }

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch { load(showSpinner = true) }
    }

    /** Refresh without the pull-to-refresh spinner, for periodic polling. */
    fun refreshQuietly() {
        viewModelScope.launch { load(showSpinner = false) }
    }

    private suspend fun load(showSpinner: Boolean) {
        if (showSpinner) _ui.update { it.copy(refreshing = true) }
        val failure: AppException? = sync.sync(notify = false)
        _ui.value = ListUi(refreshing = false, error = failure?.message, loaded = true)
    }

    fun nameOf(stationId: String): String = stationNames.value[stationId] ?: "Station"
}
