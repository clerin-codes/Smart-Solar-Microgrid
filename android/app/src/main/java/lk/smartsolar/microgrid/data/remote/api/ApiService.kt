package lk.smartsolar.microgrid.data.remote.api

import lk.smartsolar.microgrid.data.remote.dto.qr.GenerateQRRequest
import lk.smartsolar.microgrid.data.remote.dto.qr.QRResponse
import lk.smartsolar.microgrid.data.remote.dto.qr.VerifyQRRequest
import lk.smartsolar.microgrid.data.remote.dto.qr.VerifyQRResponse
import lk.smartsolar.microgrid.data.remote.dto.transaction.EnergyTransferRequest
import lk.smartsolar.microgrid.data.remote.dto.transaction.TransactionResponse
import lk.smartsolar.microgrid.data.remote.dto.transaction.TransactionsListResponse
import lk.smartsolar.microgrid.data.remote.dto.transaction.TransactionDetailResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Header

/**
 * Retrofit API Service Interface for SmartSolar Microgrid API
 */
interface ApiService {

    // ==================== QR Code Endpoints ====================

    /**
     * Generate QR code for a reservation
     * POST /api/qr/generate
     */
    @POST("api/qr/generate")
    suspend fun generateQRCode(
        @Body request: GenerateQRRequest,
        @Header("Authorization") token: String? = null
    ): QRResponse

    /**
     * Verify QR code validity
     * POST /api/qr/verify
     */
    @POST("api/qr/verify")
    suspend fun verifyQRCode(
        @Body request: VerifyQRRequest,
        @Header("Authorization") token: String? = null
    ): VerifyQRResponse

    // ==================== Transaction Endpoints ====================

    /**
     * Process energy transfer after QR verification
     * POST /api/transactions/transfer
     */
    @POST("api/transactions/transfer")
    suspend fun processEnergyTransfer(
        @Body request: EnergyTransferRequest,
        @Header("Authorization") token: String? = null
    ): TransactionResponse

    /**
     * Get transactions with pagination and filtering
     * GET /api/transactions
     */
    @GET("api/transactions")
    suspend fun getTransactions(
        @Query("page") page: Int,
        @Query("pageSize") pageSize: Int,
        @Query("status") status: String? = null,
        @Header("Authorization") token: String? = null
    ): TransactionsListResponse

    /**
     * Get transaction details by ID
     * GET /api/transactions/{id}
     */
    @GET("api/transactions/{id}")
    suspend fun getTransactionDetails(
        @Path("id") transactionId: String,
        @Header("Authorization") token: String? = null
    ): TransactionDetailResponse

    // ==================== Additional Endpoints (Placeholder) ====================

    /**
     * Get user profile
     * GET /api/users/profile
     */
    @GET("api/users/profile")
    suspend fun getUserProfile(
        @Header("Authorization") token: String
    ): retrofit2.Response<Map<String, Any>>

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @POST("api/auth/login")
    suspend fun login(
        @Body credentials: Map<String, String>
    ): retrofit2.Response<Map<String, Any>>
}
