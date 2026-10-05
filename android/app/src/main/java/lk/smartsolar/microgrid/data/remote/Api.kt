package lk.smartsolar.microgrid.data.remote

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

/** Credentials used by both Prosumer and Grid Operator sign-in. */
data class LoginRequest(
    val nic: String,
    val password: String,
)

/** Authenticated session details returned by the central API. */
data class AuthResponse(
    val token: String,
    val nic: String,
    val fullName: String,
    val role: String,
    val accountStatus: String? = null,
)

/** Public Solar Prosumer registration request. */
data class RegisterProsumerRequest(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val password: String,
)

/**
 * Safe account information returned by /api/Account/me
 * and related account operations.
 */
data class ProfileDto(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val role: String,
    val isActive: Boolean,
    val status: String,
    val deactivationRequestedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
)

/**
 * Registration creates a PendingActivation Prosumer account.
 * It intentionally does not create a login session or return a JWT.
 */
data class RegisterProsumerResponse(
    val message: String,
    val user: ProfileDto,
)

/** Editable own-profile fields. NIC and role are immutable. */
data class UpdateProfileRequest(
    val fullName: String,
    val email: String,
    val phoneNumber: String,
)

/** Response returned by account lifecycle operations. */
data class AccountActionResponse(
    val message: String,
    val user: ProfileDto,
)

/**
 * Lightweight response from /api/health.
 *
 * Nullable properties keep the Android client tolerant of small
 * non-breaking changes to the development health-check response.
 */
data class HealthResponse(
    val status: String? = null,
    val database: String? = null,
    val timestamp: String? = null,
)

/** Solar station operating schedule returned by the API. */
data class ScheduleDto(
    val day: String,
    val openingTime: String,
    val closingTime: String,
    val isAvailable: Boolean,
)

/** Solar station information returned by the API. */
data class StationDto(
    val id: String,
    val stationCode: String,
    val stationName: String,
    val latitude: Double,
    val longitude: Double,
    val capacityKw: Double,
    val batteryStorageSlots: Int,
    val availableSlots: Int,
    val schedules: List<ScheduleDto>?,
    val isActive: Boolean,
)

/** Energy booking slot returned by the API. */
data class SlotDto(
    val id: String,
    val stationId: String,
    val slotDate: String,
    val startTime: String,
    val endTime: String,
    val capacityKw: Double,
    val availableCapacityKw: Double,
    val status: Int,
)

/** Reservation and transaction information returned by the API. */
data class ReservationDto(
    val id: String,
    val reservationNumber: String,
    val prosumerNIC: String,
    val stationId: String,
    val slotId: String,
    val reservationDate: String,
    val startTime: String,
    val endTime: String,
    val status: Int,
    val qrToken: String?,
    val transactionStatus: Int,
    val approvedBy: String?,
    val completedBy: String?,
    val completedAt: String?,
    val createdAt: String,
    val updatedAt: String?,
)

/** Request used when a Prosumer creates a reservation. */
data class CreateReservationRequest(
    val stationId: String,
    val slotId: String,
    val reservationDate: String,
)

/** Request used when a Prosumer changes an existing reservation. */
data class UpdateReservationRequest(
    val slotId: String,
    val reservationDate: String,
)

/** Generic message response returned by simple API actions. */
data class MessageResponse(
    val message: String?,
)

/**
 * Standard API error body.
 *
 * Validation errors are returned as field -> list of messages,
 * allowing the Android UI to show server-side validation feedback.
 */
data class ErrorBody(
    val statusCode: Int? = null,
    val message: String? = null,
    val errors: Map<String, List<String>>? = null,
)

/** Retrofit contract for the central ASP.NET Core REST API. */
interface ApiService {

    // -------------------------------------------------
    // Infrastructure
    // -------------------------------------------------

    /**
     * Checks whether the central REST API and its dependencies
     * are available before using a manually configured server URL.
     */
    @GET("health")
    suspend fun health(): HealthResponse

    // -------------------------------------------------
    // Member 1 - Authentication and Account endpoints
    // -------------------------------------------------

    /** Authenticates an active Prosumer or Grid Operator account. */
    @POST("auth/login")
    suspend fun login(
        @Body body: LoginRequest,
    ): AuthResponse

    /**
     * Creates a new Prosumer account in PendingActivation state.
     * Backoffice approval is required before the new account can log in.
     */
    @POST("auth/register-prosumer")
    suspend fun registerProsumer(
        @Body body: RegisterProsumerRequest,
    ): RegisterProsumerResponse

    /** Returns the currently authenticated user's own account details. */
    @GET("account/me")
    suspend fun profile(): ProfileDto

    /** Updates editable fields of the authenticated user's own profile. */
    @PUT("account/me")
    suspend fun updateProfile(
        @Body body: UpdateProfileRequest,
    ): ProfileDto

    /**
     * Allows an active Prosumer to request account deactivation.
     * Backoffice must finalize the request.
     */
    @POST("account/deactivation-request")
    suspend fun requestDeactivation(): AccountActionResponse

    @GET("stations")
    suspend fun stations(): List<StationDto>

    @GET("slots")
    suspend fun slots(): List<SlotDto>

    @GET("reservations")
    suspend fun allReservations(): List<ReservationDto>

    @GET("reservations/my")
    suspend fun myReservations(): List<ReservationDto>

    @GET("reservations/{id}")
    suspend fun reservation(
        @Path("id") id: String,
    ): ReservationDto

    @POST("reservations")
    suspend fun createReservation(
        @Body body: CreateReservationRequest,
    ): ReservationDto

    @PUT("reservations/{id}")
    suspend fun updateReservation(
        @Path("id") id: String,
        @Body body: UpdateReservationRequest,
    ): ReservationDto

    @DELETE("reservations/{id}")
    suspend fun cancelReservation(
        @Path("id") id: String,
    ): MessageResponse

    @POST("reservations/{id}/approve")
    suspend fun approve(
        @Path("id") id: String,
    ): ReservationDto

    @POST("reservations/{id}/reject")
    suspend fun reject(
        @Path("id") id: String,
    ): ReservationDto

    // The backend expects the QR token as a bare JSON string.
    @POST("reservations/verify-qr")
    suspend fun verifyQr(
        @Body qrToken: String,
    ): ReservationDto

    @POST("reservations/{id}/complete")
    suspend fun complete(
        @Path("id") id: String,
    ): ReservationDto
}