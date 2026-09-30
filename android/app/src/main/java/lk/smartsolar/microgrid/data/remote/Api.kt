package lk.smartsolar.microgrid.data.remote

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

data class LoginRequest(val nic: String, val password: String)

data class AuthResponse(val token: String, val nic: String, val fullName: String, val role: String)

data class RegisterRequest(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val password: String,
)

data class ProfileDto(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String,
    val role: String,
    val isActive: Boolean,
)

data class UpdateProfileRequest(val fullName: String, val email: String, val phoneNumber: String)

data class ScheduleDto(
    val day: String,
    val openingTime: String,
    val closingTime: String,
    val isAvailable: Boolean,
)

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

data class CreateReservationRequest(val stationId: String, val slotId: String, val reservationDate: String)

data class UpdateReservationRequest(val slotId: String, val reservationDate: String)

data class MessageResponse(val message: String?)

data class ErrorBody(val statusCode: Int?, val message: String?)

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @GET("auth/profile")
    suspend fun profile(): ProfileDto

    @PUT("auth/profile")
    suspend fun updateProfile(@Body body: UpdateProfileRequest): ProfileDto

    @GET("stations")
    suspend fun stations(): List<StationDto>

    @GET("slots")
    suspend fun slots(): List<SlotDto>

    @GET("reservations")
    suspend fun allReservations(): List<ReservationDto>

    @GET("reservations/my")
    suspend fun myReservations(): List<ReservationDto>

    @GET("reservations/{id}")
    suspend fun reservation(@Path("id") id: String): ReservationDto

    @POST("reservations")
    suspend fun createReservation(@Body body: CreateReservationRequest): ReservationDto

    @PUT("reservations/{id}")
    suspend fun updateReservation(@Path("id") id: String, @Body body: UpdateReservationRequest): ReservationDto

    @DELETE("reservations/{id}")
    suspend fun cancelReservation(@Path("id") id: String): MessageResponse

    @POST("reservations/{id}/approve")
    suspend fun approve(@Path("id") id: String): ReservationDto

    // The endpoint reads a bare JSON string from the body.
    @POST("reservations/verify-qr")
    suspend fun verifyQr(@Body qrToken: String): ReservationDto

    @POST("reservations/{id}/complete")
    suspend fun complete(@Path("id") id: String): ReservationDto
}
