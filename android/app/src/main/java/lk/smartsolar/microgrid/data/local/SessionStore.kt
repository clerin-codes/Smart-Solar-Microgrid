package lk.smartsolar.microgrid.data.local

import android.content.Context
import android.content.SharedPreferences
import lk.smartsolar.microgrid.BuildConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class Session(val token: String, val nic: String, val fullName: String, val role: String) {
    val isProsumer get() = role == ROLE_PROSUMER
    val isGridOperator get() = role == ROLE_GRID_OPERATOR

    companion object {
        const val ROLE_PROSUMER = "Prosumer"
        const val ROLE_GRID_OPERATOR = "GridOperator"
        const val ROLE_BACKOFFICE = "Backoffice"
    }
}

/** Login session plus small device settings (server address, last sync time), kept in private preferences. */
class SessionStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("sunchain_session", Context.MODE_PRIVATE)

    private val _session = MutableStateFlow(read())
    val session: StateFlow<Session?> = _session

    private val _baseUrl = MutableStateFlow(prefs.getString(KEY_BASE_URL, null) ?: BuildConfig.API_BASE_URL)
    val baseUrl: StateFlow<String> = _baseUrl

    private val _lastSync = MutableStateFlow(prefs.getLong(KEY_LAST_SYNC, 0L))
    val lastSync: StateFlow<Long> = _lastSync

    val token: String? get() = _session.value?.token

    private fun read(): Session? {
        val token = prefs.getString(KEY_TOKEN, null) ?: return null
        return Session(
            token = token,
            nic = prefs.getString(KEY_NIC, "") ?: "",
            fullName = prefs.getString(KEY_NAME, "") ?: "",
            role = prefs.getString(KEY_ROLE, "") ?: "",
        )
    }

    fun save(session: Session) {
        prefs.edit()
            .putString(KEY_TOKEN, session.token)
            .putString(KEY_NIC, session.nic)
            .putString(KEY_NAME, session.fullName)
            .putString(KEY_ROLE, session.role)
            .apply()
        _session.value = session
    }

    fun updateName(fullName: String) {
        val current = _session.value ?: return
        save(current.copy(fullName = fullName))
    }

    fun clear() {
        prefs.edit()
            .remove(KEY_TOKEN).remove(KEY_NIC).remove(KEY_NAME).remove(KEY_ROLE).remove(KEY_LAST_SYNC)
            .apply()
        _session.value = null
        _lastSync.value = 0L
    }

    fun setBaseUrl(url: String) {
        val normalised = url.trim().let { if (it.endsWith("/")) it else "$it/" }
        prefs.edit().putString(KEY_BASE_URL, normalised).apply()
        _baseUrl.value = normalised
    }

    fun markSynced(now: Long = System.currentTimeMillis()) {
        prefs.edit().putLong(KEY_LAST_SYNC, now).apply()
        _lastSync.value = now
    }

    private companion object {
        const val KEY_TOKEN = "token"
        const val KEY_NIC = "nic"
        const val KEY_NAME = "name"
        const val KEY_ROLE = "role"
        const val KEY_BASE_URL = "base_url"
        const val KEY_LAST_SYNC = "last_sync"
    }
}
