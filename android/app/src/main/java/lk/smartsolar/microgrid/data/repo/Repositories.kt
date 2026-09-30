package lk.smartsolar.microgrid.data.repo

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import lk.smartsolar.microgrid.data.local.AppDatabase
import lk.smartsolar.microgrid.data.local.FavoriteEntity
import lk.smartsolar.microgrid.data.local.ReservationEntity
import lk.smartsolar.microgrid.data.local.Session
import lk.smartsolar.microgrid.data.local.SessionStore
import lk.smartsolar.microgrid.data.local.SlotEntity
import lk.smartsolar.microgrid.data.local.StationEntity
import lk.smartsolar.microgrid.data.remote.ApiProvider
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.remote.CreateReservationRequest
import lk.smartsolar.microgrid.data.remote.LoginRequest
import lk.smartsolar.microgrid.data.remote.ProfileDto
import lk.smartsolar.microgrid.data.remote.RegisterRequest
import lk.smartsolar.microgrid.data.remote.UpdateProfileRequest
import lk.smartsolar.microgrid.data.remote.UpdateReservationRequest
import lk.smartsolar.microgrid.data.toEntity

class AuthRepository(
    private val api: ApiProvider,
    private val session: SessionStore,
    private val db: AppDatabase,
) {
    val current get() = session.session

    private fun startSession(nic: String, fullName: String, role: String, token: String): Session {
        if (role == Session.ROLE_BACKOFFICE) {
            throw AppException("Admin accounts use the SunChain web portal. This app is for Prosumers and Grid Operators.")
        }
        return Session(token, nic, fullName, role).also { session.save(it) }
    }

    suspend fun login(nic: String, password: String): Session {
        val r = api.call { it.login(LoginRequest(nic.trim(), password)) }
        return startSession(r.nic, r.fullName, r.role, r.token)
    }

    suspend fun register(nic: String, fullName: String, email: String, phone: String, password: String): Session {
        val r = api.call { it.register(RegisterRequest(nic.trim(), fullName.trim(), email.trim(), phone.trim(), password)) }
        return startSession(r.nic, r.fullName, r.role, r.token)
    }

    suspend fun profile(): ProfileDto = api.call { it.profile() }

    suspend fun updateProfile(fullName: String, email: String, phone: String): ProfileDto {
        val updated = api.call { it.updateProfile(UpdateProfileRequest(fullName.trim(), email.trim(), phone.trim())) }
        session.updateName(updated.fullName)
        return updated
    }

    /** Signs out and wipes everything cached for this user. */
    suspend fun logout() {
        session.clear()
        withContext(Dispatchers.IO) { db.clearAllTables() }
    }
}

class StationRepository(
    private val api: ApiProvider,
    private val db: AppDatabase,
) {
    val stations: Flow<List<StationEntity>> = db.stations().observeAll()
    val slots: Flow<List<SlotEntity>> = db.slots().observeAll()
    val favoriteIds: Flow<List<String>> = db.favorites().observeIds()

    fun station(id: String): Flow<StationEntity?> = db.stations().observe(id)
    fun slotsFor(stationId: String): Flow<List<SlotEntity>> = db.slots().observeForStation(stationId)

    /** Downloads stations and slots and replaces the local copy. */
    suspend fun refresh() {
        val stations = api.call { it.stations() }.map { it.toEntity() }
        val slots = api.call { it.slots() }.map { it.toEntity() }
        db.stations().replaceAll(stations)
        db.slots().replaceAll(slots)
    }

    suspend fun toggleFavorite(stationId: String) {
        if (db.favorites().count(stationId) > 0) db.favorites().remove(stationId)
        else db.favorites().add(FavoriteEntity(stationId))
    }
}

class ReservationRepository(
    private val api: ApiProvider,
    private val db: AppDatabase,
    private val session: SessionStore,
) {
    val reservations: Flow<List<ReservationEntity>> = db.reservations().observeAll()

    fun reservation(id: String): Flow<ReservationEntity?> = db.reservations().observe(id)

    /** Prosumers see their own reservations; Grid Operators see all of them. */
    suspend fun refresh() {
        val list = if (session.session.value?.isProsumer == true) {
            api.call { it.myReservations() }
        } else {
            api.call { it.allReservations() }
        }
        db.reservations().replaceAll(list.map { it.toEntity() })
        session.markSynced()
    }

    suspend fun refreshOne(id: String) {
        db.reservations().insert(api.call { it.reservation(id) }.toEntity())
    }

    private suspend fun store(entity: ReservationEntity): ReservationEntity {
        db.reservations().insert(entity)
        return entity
    }

    suspend fun create(stationId: String, slot: SlotEntity): ReservationEntity =
        store(api.call { it.createReservation(CreateReservationRequest(stationId, slot.id, "${slot.date}T00:00:00Z")) }.toEntity())

    suspend fun update(id: String, slot: SlotEntity): ReservationEntity =
        store(api.call { it.updateReservation(id, UpdateReservationRequest(slot.id, "${slot.date}T00:00:00Z")) }.toEntity())

    suspend fun cancel(id: String) {
        api.call { it.cancelReservation(id) }
        refreshOne(id)
    }

    suspend fun approve(id: String): ReservationEntity = store(api.call { it.approve(id) }.toEntity())

    suspend fun verifyQr(token: String): ReservationEntity = store(api.call { it.verifyQr(token.trim()) }.toEntity())

    suspend fun complete(id: String): ReservationEntity = store(api.call { it.complete(id) }.toEntity())
}
