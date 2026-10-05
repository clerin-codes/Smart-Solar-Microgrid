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
import lk.smartsolar.microgrid.data.local.UserProfileEntity
import lk.smartsolar.microgrid.data.remote.AccountActionResponse
import lk.smartsolar.microgrid.data.remote.ApiProvider
import lk.smartsolar.microgrid.data.remote.AppException
import lk.smartsolar.microgrid.data.remote.CreateReservationRequest
import lk.smartsolar.microgrid.data.remote.LoginRequest
import lk.smartsolar.microgrid.data.remote.OfflineException
import lk.smartsolar.microgrid.data.remote.ProfileDto
import lk.smartsolar.microgrid.data.remote.RegisterProsumerRequest
import lk.smartsolar.microgrid.data.remote.RegisterProsumerResponse
import lk.smartsolar.microgrid.data.remote.UpdateProfileRequest
import lk.smartsolar.microgrid.data.remote.UpdateReservationRequest
import lk.smartsolar.microgrid.data.toEntity

/* =====================================================
   Member 1 - Authentication Repository
===================================================== */

/**
 * Handles authentication and own-account operations.
 *
 * Business rules stay in the central API. The Android
 * application only submits requests and caches safe data.
 */
class AuthRepository(
    private val api:
    ApiProvider,

    private val session:
    SessionStore,

    private val db:
    AppDatabase,
) {

    val current
        get() =
            session.session

    /**
     * Creates an Android session only for roles that
     * are permitted to use the Android application.
     */
    private fun startSession(
        nic: String,
        fullName: String,
        role: String,
        token: String,
    ): Session {

        if (
            role ==
            Session.ROLE_BACKOFFICE
        ) {
            throw AppException(
                "Backoffice accounts use the SunChain web portal. " +
                        "This app is for Solar Prosumers and Grid Operators.",
            )
        }

        return Session(
            token =
                token,

            nic =
                nic,

            fullName =
                fullName,

            role =
                role,
        ).also {
            session.save(
                it,
            )
        }
    }

    /** Authenticates credentials and stores the returned JWT session. */
    suspend fun login(
        nic: String,
        password: String,
    ): Session {

        val response =
            api.call {
                it.login(
                    LoginRequest(
                        nic =
                            nic
                                .trim()
                                .uppercase(),

                        password =
                            password,
                    ),
                )
            }

        return startSession(
            response.nic,
            response.fullName,
            response.role,
            response.token,
        )
    }

    /**
     * Creates a pending Prosumer account.
     *
     * Registration deliberately does not log the user in because
     * Backoffice activation is required first.
     */
    suspend fun registerProsumer(
        nic: String,
        fullName: String,
        email: String,
        phone: String,
        password: String,
    ): RegisterProsumerResponse =

        api.call {
            it.registerProsumer(
                RegisterProsumerRequest(
                    nic =
                        nic
                            .trim()
                            .uppercase(),

                    fullName =
                        fullName
                            .trim(),

                    email =
                        email
                            .trim()
                            .lowercase(),

                    phoneNumber =
                        phone
                            .trim(),

                    password =
                        password,
                ),
            )
        }

    /**
     * Loads the authenticated user's profile from the API
     * and stores the safe profile data in SQLite.
     *
     * When the network is unavailable, an existing SQLite
     * profile can still be displayed.
     */
    suspend fun profile():
            ProfileDto {

        val nic =
            session
                .session
                .value
                ?.nic

        return try {

            api.call {
                it.profile()
            }
                .also {
                    db.userProfiles()
                        .save(
                            it.toEntity(),
                        )
                }

        } catch (
            error:
            OfflineException,
        ) {

            val cached =
                nic?.let {
                    db.userProfiles()
                        .get(
                            it,
                        )
                }

            cached?.toDto()
                ?: throw error
        }
    }

    /** Updates only the editable own-profile fields. */
    suspend fun updateProfile(
        fullName: String,
        email: String,
        phone: String,
    ): ProfileDto {

        val updated =
            api.call {
                it.updateProfile(
                    UpdateProfileRequest(
                        fullName =
                            fullName
                                .trim(),

                        email =
                            email
                                .trim()
                                .lowercase(),

                        phoneNumber =
                            phone
                                .trim(),
                    ),
                )
            }

        db.userProfiles()
            .save(
                updated.toEntity(),
            )

        session.updateName(
            updated.fullName,
        )

        return updated
    }

    /**
     * Sends an authenticated Prosumer deactivation request.
     * Backoffice is responsible for final lifecycle processing.
     */
    suspend fun requestDeactivation():
            AccountActionResponse {

        val response =
            api.call {
                it.requestDeactivation()
            }

        db.userProfiles()
            .save(
                response
                    .user
                    .toEntity(),
            )

        return response
    }

    /** Signs out and removes locally cached user data. */
    suspend fun logout() {

        session.clear()

        withContext(
            Dispatchers.IO,
        ) {
            db.clearAllTables()
        }
    }
}

/* =====================================================
   Existing Station Repository
===================================================== */

class StationRepository(
    private val api:
    ApiProvider,

    private val db:
    AppDatabase,
) {

    val stations:
            Flow<List<StationEntity>> =
        db.stations()
            .observeAll()

    val slots:
            Flow<List<SlotEntity>> =
        db.slots()
            .observeAll()

    val favoriteIds:
            Flow<List<String>> =
        db.favorites()
            .observeIds()

    fun station(
        id: String,
    ): Flow<StationEntity?> =
        db.stations()
            .observe(
                id,
            )

    fun slotsFor(
        stationId: String,
    ): Flow<List<SlotEntity>> =
        db.slots()
            .observeForStation(
                stationId,
            )

    /** Downloads stations and slots and replaces the local copy. */
    suspend fun refresh() {

        val stations =
            api.call {
                it.stations()
            }
                .map {
                    it.toEntity()
                }

        val slots =
            api.call {
                it.slots()
            }
                .map {
                    it.toEntity()
                }

        db.stations()
            .replaceAll(
                stations,
            )

        db.slots()
            .replaceAll(
                slots,
            )
    }

    suspend fun toggleFavorite(
        stationId: String,
    ) {

        if (
            db.favorites()
                .count(
                    stationId,
                ) > 0
        ) {
            db.favorites()
                .remove(
                    stationId,
                )
        } else {
            db.favorites()
                .add(
                    FavoriteEntity(
                        stationId,
                    ),
                )
        }
    }
}

/* =====================================================
   Existing Reservation Repository
===================================================== */

class ReservationRepository(
    private val api:
    ApiProvider,

    private val db:
    AppDatabase,

    private val session:
    SessionStore,
) {

    val reservations:
            Flow<List<ReservationEntity>> =
        db.reservations()
            .observeAll()

    fun reservation(
        id: String,
    ): Flow<ReservationEntity?> =
        db.reservations()
            .observe(
                id,
            )

    /** Prosumers see their own reservations; Grid Operators see all. */
    suspend fun refresh() {

        val list =
            if (
                session
                    .session
                    .value
                    ?.isProsumer ==
                true
            ) {

                api.call {
                    it.myReservations()
                }

            } else {

                api.call {
                    it.allReservations()
                }
            }

        db.reservations()
            .replaceAll(
                list.map {
                    it.toEntity()
                },
            )

        session.markSynced()
    }

    suspend fun refreshOne(
        id: String,
    ) {

        db.reservations()
            .insert(
                api.call {
                    it.reservation(
                        id,
                    )
                }
                    .toEntity(),
            )
    }

    private suspend fun store(
        entity:
        ReservationEntity,
    ): ReservationEntity {

        db.reservations()
            .insert(
                entity,
            )

        return entity
    }

    suspend fun create(
        stationId: String,
        slot: SlotEntity,
    ): ReservationEntity =

        store(
            api.call {
                it.createReservation(
                    CreateReservationRequest(
                        stationId =
                            stationId,

                        slotId =
                            slot.id,

                        reservationDate =
                            "${slot.date}T00:00:00Z",
                    ),
                )
            }
                .toEntity(),
        )

    suspend fun update(
        id: String,
        slot: SlotEntity,
    ): ReservationEntity =

        store(
            api.call {
                it.updateReservation(
                    id,

                    UpdateReservationRequest(
                        slotId =
                            slot.id,

                        reservationDate =
                            "${slot.date}T00:00:00Z",
                    ),
                )
            }
                .toEntity(),
        )

    suspend fun cancel(
        id: String,
    ) {

        api.call {
            it.cancelReservation(
                id,
            )
        }

        refreshOne(
            id,
        )
    }

    suspend fun approve(
        id: String,
    ): ReservationEntity =

        store(
            api.call {
                it.approve(
                    id,
                )
            }
                .toEntity(),
        )

    suspend fun verifyQr(
        token: String,
    ): ReservationEntity =

        store(
            api.call {
                it.verifyQr(
                    token.trim(),
                )
            }
                .toEntity(),
        )

    suspend fun complete(
        id: String,
    ): ReservationEntity =

        store(
            api.call {
                it.complete(
                    id,
                )
            }
                .toEntity(),
        )
}

/* =====================================================
   Member 1 - SQLite profile mappings
===================================================== */

/** Converts an API profile into a SQLite entity. */
private fun ProfileDto.toEntity() =
    UserProfileEntity(
        nic =
            nic,

        fullName =
            fullName,

        email =
            email,

        phoneNumber =
            phoneNumber,

        role =
            role,

        isActive =
            isActive,

        status =
            status,

        deactivationRequestedAt =
            deactivationRequestedAt,

        createdAt =
            createdAt,

        updatedAt =
            updatedAt,
    )

/** Converts a cached SQLite profile back into the UI model. */
private fun UserProfileEntity.toDto() =
    ProfileDto(
        nic =
            nic,

        fullName =
            fullName,

        email =
            email,

        phoneNumber =
            phoneNumber,

        role =
            role,

        isActive =
            isActive,

        status =
            status,

        deactivationRequestedAt =
            deactivationRequestedAt,

        createdAt =
            createdAt,

        updatedAt =
            updatedAt,
    )