package lk.smartsolar.microgrid.data.local.qr

import android.content.Context
import android.util.Log

/**
 * Local data source for QR code caching using SharedPreferences
 */
class QRLocalDataSource(private val context: Context) {

    private val sharedPreferences = context.getSharedPreferences(
        "qr_cache",
        Context.MODE_PRIVATE
    )

    /**
     * Cache QR code locally
     */
    fun cacheQRCode(
        reservationId: String,
        token: String,
        expiresAt: String
    ) {
        try {
            sharedPreferences.edit().apply {
                putString("$QR_PREFIX$reservationId", token)
                putString("$EXPIRY_PREFIX$reservationId", expiresAt)
                putLong("$TIMESTAMP_PREFIX$reservationId", System.currentTimeMillis())
                apply()
            }
            Log.d("QRLocalDataSource", "QR code cached for reservation: $reservationId")
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error caching QR: ${e.message}")
        }
    }

    /**
     * Get cached QR code
     */
    fun getQRCode(reservationId: String): QRCacheModel? {
        return try {
            val token = sharedPreferences.getString("$QR_PREFIX$reservationId", null)
            val expiresAt = sharedPreferences.getString("$EXPIRY_PREFIX$reservationId", null)
            val timestamp = sharedPreferences.getLong("$TIMESTAMP_PREFIX$reservationId", 0L)

            if (token != null && expiresAt != null && !isExpired(timestamp)) {
                QRCacheModel(reservationId, token, expiresAt)
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error retrieving QR: ${e.message}")
            null
        }
    }

    /**
     * Get all cached QR codes
     */
    fun getAllQRCodes(): List<QRCacheModel> {
        return try {
            val qrCodes = mutableListOf<QRCacheModel>()
            val allEntries = sharedPreferences.all
            
            for ((key, value) in allEntries) {
                if (key.startsWith(QR_PREFIX)) {
                    val reservationId = key.removePrefix(QR_PREFIX)
                    val expiry = sharedPreferences.getString("$EXPIRY_PREFIX$reservationId", null)
                    val timestamp = sharedPreferences.getLong("$TIMESTAMP_PREFIX$reservationId", 0L)
                    
                    if (expiry != null && !isExpired(timestamp) && value is String) {
                        qrCodes.add(QRCacheModel(reservationId, value, expiry))
                    }
                }
            }
            qrCodes
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error retrieving all QR codes: ${e.message}")
            emptyList()
        }
    }

    /**
     * Clear expired QR codes
     */
    fun clearExpiredQRCodes() {
        try {
            val editor = sharedPreferences.edit()
            val allEntries = sharedPreferences.all
            
            for ((key, _) in allEntries) {
                if (key.startsWith(QR_PREFIX)) {
                    val reservationId = key.removePrefix(QR_PREFIX)
                    val timestamp = sharedPreferences.getLong("$TIMESTAMP_PREFIX$reservationId", 0L)
                    
                    if (isExpired(timestamp)) {
                        editor.remove(key)
                        editor.remove("$EXPIRY_PREFIX$reservationId")
                        editor.remove("$TIMESTAMP_PREFIX$reservationId")
                    }
                }
            }
            editor.apply()
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error clearing expired QR codes: ${e.message}")
        }
    }

    /**
     * Delete QR code
     */
    fun deleteQRCode(reservationId: String) {
        try {
            sharedPreferences.edit().apply {
                remove("$QR_PREFIX$reservationId")
                remove("$EXPIRY_PREFIX$reservationId")
                remove("$TIMESTAMP_PREFIX$reservationId")
                apply()
            }
            Log.d("QRLocalDataSource", "QR code deleted for reservation: $reservationId")
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error deleting QR: ${e.message}")
        }
    }

    /**
     * Cache verification result
     */
    fun cacheVerification(
        token: String,
        gridOperatorId: String,
        verifiedAt: Long
    ) {
        try {
            sharedPreferences.edit().apply {
                putString("$VERIFICATION_PREFIX$token", gridOperatorId)
                putLong("$VERIFICATION_TIME_PREFIX$token", verifiedAt)
                apply()
            }
        } catch (e: Exception) {
            Log.e("QRLocalDataSource", "Error caching verification: ${e.message}")
        }
    }

    /**
     * Check if timestamp is expired (2 hours)
     */
    private fun isExpired(timestamp: Long): Boolean {
        val twoHoursInMillis = 2 * 60 * 60 * 1000
        return System.currentTimeMillis() - timestamp > twoHoursInMillis
    }

    companion object {
        private const val QR_PREFIX = "qr_"
        private const val EXPIRY_PREFIX = "expiry_"
        private const val TIMESTAMP_PREFIX = "timestamp_"
        private const val VERIFICATION_PREFIX = "verification_"
        private const val VERIFICATION_TIME_PREFIX = "verification_time_"
    }
}

/**
 * QR Cache Model
 */
data class QRCacheModel(
    val reservationId: String,
    val token: String,
    val expiresAt: String
)
