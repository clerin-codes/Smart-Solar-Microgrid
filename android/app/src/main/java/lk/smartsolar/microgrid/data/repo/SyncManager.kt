package lk.smartsolar.microgrid.data.repo

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import lk.smartsolar.microgrid.data.local.AppDatabase
import lk.smartsolar.microgrid.data.local.SessionStore
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.notifications.ChangeDetector
import lk.smartsolar.microgrid.notifications.Notifier

/** Refreshes everything from the server and posts a notification for anything that changed. */
class SyncManager(
    private val stations: StationRepository,
    private val reservations: ReservationRepository,
    private val db: AppDatabase,
    private val session: SessionStore,
    private val notifier: Notifier,
) {
    private val lock = Mutex()

    /** Returns null on success, or the reason the sync could not complete (for example, offline). */
    suspend fun sync(notify: Boolean = true): AppException? = lock.withLock {
        val current = session.session.value ?: return null
        val before = db.reservations().getAll().associateBy { it.id }
        try {
            stations.refresh()
            reservations.refresh()
        } catch (e: AppException) {
            return e
        }
        if (notify && before.isNotEmpty()) {
            ChangeDetector.changes(before, db.reservations().getAll(), current.isProsumer).forEach(notifier::show)
        }
        null
    }
}
