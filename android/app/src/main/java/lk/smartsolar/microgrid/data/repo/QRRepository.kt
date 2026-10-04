package lk.smartsolar.microgrid.data.repo

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import lk.smartsolar.microgrid.data.local.qr.QRLocalDataSource
import lk.smartsolar.microgrid.data.remote.api.ApiService
import lk.smartsolar.microgrid.data.remote.dto.qr.GenerateQRRequest
import lk.smartsolar.microgrid.data.remote.dto.qr.QRResponse
import lk.smartsolar.microgrid.data.remote.dto.qr.VerifyQRRequest
import lk.smartsolar.microgrid.data.remote.dto.qr.VerifyQRResponse

/**
 * Repository for QR Code operations
 * Handles data from both local and remote sources
 */
class QRRepository(
    private val apiService: ApiService,
    private val localDataSource: QRLocalDataSource
) {

    /**
     * Generate QR code from remote API
     */
    suspend fun generateQRCode(reservationId: String): QRResponse {
        return withContext(Dispatchers.IO) {
            try {
                val request = GenerateQRRequest(reservationId)
                val response = apiService.generateQRCode(request)

                // Cache the QR code locally if successful
                if (response.success) {
                    response.qrData?.let { qrData ->
                        localDataSource.cacheQRCode(
                            reservationId = reservationId,
                            token = qrData.token,
                            expiresAt = qrData.expiresAt
                        )
                    }
                }

                response
            } catch (e: Exception) {
                Log.e("QRRepository", "Error generating QR: ${e.message}")
                throw e
            }
        }
    }

    /**
     * Verify QR code with remote API
     */
    suspend fun verifyQRCode(
        qrToken: String,
        gridOperatorId: String
    ): VerifyQRResponse {
        return withContext(Dispatchers.IO) {
            try {
                val request = VerifyQRRequest(qrToken, gridOperatorId)
                val response = apiService.verifyQRCode(request)

                // Cache verification result locally if successful
                if (response.success && response.valid) {
                    response.verificationData?.let { data ->
                        localDataSource.cacheVerification(
                            token = qrToken,
                            gridOperatorId = gridOperatorId,
                            verifiedAt = System.currentTimeMillis()
                        )
                    }
                }

                response
            } catch (e: Exception) {
                Log.e("QRRepository", "Error verifying QR: ${e.message}")
                throw e
            }
        }
    }

    /**
     * Get cached QR code
     */
    suspend fun getCachedQRCode(reservationId: String) = 
        withContext(Dispatchers.IO) {
            localDataSource.getQRCode(reservationId)
        }

    /**
     * Get all cached QR codes
     */
    suspend fun getAllCachedQRCodes() = 
        withContext(Dispatchers.IO) {
            localDataSource.getAllQRCodes()
        }

    /**
     * Clear expired QR codes from cache
     */
    suspend fun clearExpiredQRCodes() = 
        withContext(Dispatchers.IO) {
            localDataSource.clearExpiredQRCodes()
        }

    /**
     * Delete cached QR code
     */
    suspend fun deleteQRCode(reservationId: String) = 
        withContext(Dispatchers.IO) {
            localDataSource.deleteQRCode(reservationId)
        }
}
