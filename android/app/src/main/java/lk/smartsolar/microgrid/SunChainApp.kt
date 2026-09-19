package lk.smartsolar.microgrid

import android.app.Application
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.local.AppDatabase
import lk.smartsolar.microgrid.data.local.SessionStore
import lk.smartsolar.microgrid.data.remote.ApiProvider
import lk.smartsolar.microgrid.data.repo.AuthRepository
import lk.smartsolar.microgrid.data.repo.ReservationRepository
import lk.smartsolar.microgrid.data.repo.StationRepository
import lk.smartsolar.microgrid.data.repo.SyncManager
import lk.smartsolar.microgrid.notifications.Notifier
import lk.smartsolar.microgrid.notifications.SyncWorker

/** Hand-wired dependencies; small enough that a DI framework would only add build risk. */
class AppContainer(context: Context) {
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    val session = SessionStore(context)
    val db = AppDatabase.create(context)
    val apiProvider = ApiProvider(session)
    val auth = AuthRepository(apiProvider, session, db)
    val stations = StationRepository(apiProvider, db)
    val reservations = ReservationRepository(apiProvider, db, session)
    val notifier = Notifier(context)
    val sync = SyncManager(stations, reservations, db, session, notifier)

    private val _online = MutableStateFlow(true)
    /** Whether the device currently has a network connection. */
    val online: StateFlow<Boolean> = _online

    init {
        val cm = context.getSystemService(ConnectivityManager::class.java)
        _online.value = cm.getNetworkCapabilities(cm.activeNetwork)?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true
        cm.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                _online.value = true
                // Back online: push a refresh so cached data catches up.
                appScope.launch { sync.sync() }
            }

            override fun onLost(network: Network) {
                _online.value = false
            }
        })
    }
}

class SunChainApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        SyncWorker.schedule(this)
    }
}
