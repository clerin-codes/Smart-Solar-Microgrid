package lk.smartsolar.microgrid.ui.prosumer

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.ViewList
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.BuildConfig
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.ui.common.EmptyState
import lk.smartsolar.microgrid.ui.common.ErrorBanner
import lk.smartsolar.microgrid.ui.common.LocalContainer
import lk.smartsolar.microgrid.ui.common.OfflineBanner
import lk.smartsolar.microgrid.ui.common.StatusChip
import lk.smartsolar.microgrid.ui.common.SunChainTopBar
import lk.smartsolar.microgrid.ui.common.containerViewModel
import lk.smartsolar.microgrid.util.Fmt

data class StationsUi(val refreshing: Boolean = false, val error: String? = null)

class StationsViewModel(private val repo: StationRepository) : ViewModel() {
    val stations: StateFlow<List<StationEntity>> = repo.stations.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
    val favorites: StateFlow<Set<String>> =
        repo.favoriteIds.map { it.toSet() }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptySet())

    private val _ui = MutableStateFlow(StationsUi())
    val ui: StateFlow<StationsUi> = _ui

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _ui.update { it.copy(refreshing = true) }
            val error = try {
                repo.refresh(); null
            } catch (e: AppException) {
                e.message
            }
            _ui.value = StationsUi(false, error)
        }
    }

    fun toggleFavorite(id: String) {
        viewModelScope.launch { repo.toggleFavorite(id) }
    }
}

enum class StationFilter(val label: String) { All("All"), Active("Active"), Favorites("Favorites") }

fun filterStations(list: List<StationEntity>, favorites: Set<String>, filter: StationFilter, query: String): List<StationEntity> =
    list.filter { s ->
        when (filter) {
            StationFilter.All -> true
            StationFilter.Active -> s.isActive
            StationFilter.Favorites -> s.id in favorites
        } && (query.isBlank() || "${s.name} ${s.code}".contains(query.trim(), ignoreCase = true))
    }

fun openInMaps(context: Context, s: StationEntity) {
    val uri = Uri.parse("geo:${s.latitude},${s.longitude}?q=${s.latitude},${s.longitude}(${Uri.encode(s.name)})")
    runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, uri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StationsScreen(onOpen: (String) -> Unit) {
    val container = LocalContainer.current
    val online by container.online.collectAsState()
    val lastSync by container.session.lastSync.collectAsState()
    val vm = containerViewModel { StationsViewModel(it.stations) }
    val stations by vm.stations.collectAsState()
    val favorites by vm.favorites.collectAsState()
    val ui by vm.ui.collectAsState()
    var query by rememberSaveable { mutableStateOf("") }
    var filter by rememberSaveable { mutableStateOf(StationFilter.All) }
    var showMap by rememberSaveable { mutableStateOf(false) }

    val visible = remember(stations, favorites, filter, query) { filterStations(stations, favorites, filter, query) }

    Column {
        SunChainTopBar("Stations")
        OfflineBanner(online, lastSync)
        Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                query, { query = it }, placeholder = { Text("Search stations") }, singleLine = true,
                modifier = Modifier.weight(1f).testTag("station_search"),
            )
            IconButton(onClick = { showMap = !showMap }, modifier = Modifier.testTag("toggle_map")) {
                Icon(if (showMap) Icons.Filled.ViewList else Icons.Filled.Map, contentDescription = if (showMap) "Show list" else "Show map")
            }
        }
        Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StationFilter.entries.forEach { f ->
                FilterChip(selected = filter == f, onClick = { filter = f }, label = { Text(f.label) })
            }
        }
        if (online) ErrorBanner(ui.error, vm::refresh)

        PullToRefreshBox(isRefreshing = ui.refreshing, onRefresh = vm::refresh, modifier = Modifier.fillMaxSize()) {
            when {
                visible.isEmpty() -> EmptyState("No stations found", if (filter == StationFilter.Favorites) "Tap the star on a station to add it here." else "Try a different search.")
                showMap -> StationsMap(visible, onOpen)
                else -> LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(visible, key = { it.id }) { s ->
                        StationCard(s, s.id in favorites, onOpen = { onOpen(s.id) }, onFavorite = { vm.toggleFavorite(s.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun StationCard(s: StationEntity, favorite: Boolean, onOpen: () -> Unit, onFavorite: () -> Unit) {
    Card(
        Modifier.fillMaxWidth().clickable(onClick = onOpen).testTag("station_${s.code}"),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(s.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                Text(s.code, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text("${Fmt.kw(s.capacityKw)} · ${s.availableSlots}/${s.batterySlots} battery slots free", style = MaterialTheme.typography.bodyMedium)
                StatusChip(if (s.isActive) "Active" else "Inactive")
            }
            IconButton(onClick = onFavorite, modifier = Modifier.testTag("fav_${s.code}")) {
                Icon(if (favorite) Icons.Filled.Star else Icons.Filled.StarBorder, contentDescription = if (favorite) "Remove favorite" else "Add favorite", tint = if (favorite) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

/** Google Map when an API key is configured; otherwise a list with "Open in Maps" buttons that need no key. */
@Composable
private fun StationsMap(stations: List<StationEntity>, onOpen: (String) -> Unit) {
    val context = LocalContext.current
    if (BuildConfig.MAPS_API_KEY.isBlank()) {
        LazyColumn(contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                Text(
                    "The in-app map needs a Google Maps API key (MAPS_API_KEY in android/local.properties). You can still open any station in your maps app.",
                    style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            items(stations, key = { it.id }) { s ->
                Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(s.name, fontWeight = FontWeight.SemiBold)
                            Text("%.4f, %.4f".format(s.latitude, s.longitude), style = MaterialTheme.typography.bodySmall)
                        }
                        OutlinedButton(onClick = { openInMaps(context, s) }) { Text("Open in Maps") }
                    }
                }
            }
        }
        return
    }
    val first = stations.first()
    val camera = rememberCameraPositionState { position = CameraPosition.fromLatLngZoom(LatLng(first.latitude, first.longitude), 7f) }
    GoogleMap(Modifier.fillMaxSize().testTag("google_map"), cameraPositionState = camera) {
        stations.forEach { s ->
            Marker(
                state = MarkerState(LatLng(s.latitude, s.longitude)),
                title = s.name,
                snippet = "${Fmt.kw(s.capacityKw)} · tap the info window to open",
                onInfoWindowClick = { onOpen(s.id) },
            )
        }
    }
}
