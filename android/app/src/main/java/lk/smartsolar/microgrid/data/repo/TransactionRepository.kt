package lk.smartsolar.microgrid.data.repo

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import lk.smartsolar.microgrid.data.local.transaction.TransactionLocalDataSource
import lk.smartsolar.microgrid.data.remote.api.ApiService
import lk.smartsolar.microgrid.data.remote.dto.transaction.EnergyTransferRequest
import lk.smartsolar.microgrid.data.remote.dto.transaction.TransactionResponse
import lk.smartsolar.microgrid.data.remote.dto.transaction.TransactionsListResponse
import lk.smartsolar.microgrid.ui.operator.TransactionModel

/**
 * Repository for Transaction operations
 * Handles data from both local and remote sources
 */
class TransactionRepository(
    private val apiService: ApiService,
    private val localDataSource: TransactionLocalDataSource
) {

    /**
     * Process energy transfer after QR verification
     */
    suspend fun processEnergyTransfer(
        reservationId: String,
        qrToken: String
    ): TransactionProcessResponse {
        return withContext(Dispatchers.IO) {
            try {
                val request = EnergyTransferRequest(reservationId, qrToken)
                val response = apiService.processEnergyTransfer(request)

                // Cache transaction locally if successful
                if (response.success) {
                    response.data?.let { transaction ->
                        localDataSource.insertTransaction(
                            id = transaction.id,
                            reservationId = transaction.reservationId,
                            units = transaction.units,
                            amount = transaction.amount,
                            status = transaction.status,
                            timestamp = transaction.timestamp
                        )
                    }
                }

                return@withContext TransactionProcessResponse(
                    success = response.success,
                    message = response.message,
                    transaction = response.data?.let { data ->
                        TransactionModel(
                            id = data.id,
                            reservationId = data.reservationId,
                            units = data.units,
                            amount = data.amount,
                            status = data.status,
                            timestamp = data.timestamp,
                            gridOperator = data.gridOperator
                        )
                    }
                )
            } catch (e: Exception) {
                Log.e("TransactionRepository", "Error processing transfer: ${e.message}")
                throw e
            }
        }
    }

    /**
     * Get transactions from remote API with pagination and filtering
     */
    suspend fun getTransactions(
        page: Int = 1,
        pageSize: Int = 10,
        statusFilter: String? = null
    ): TransactionListResponse {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getTransactions(page, pageSize, statusFilter)

                // Cache transactions locally if successful
                if (response.success) {
                    response.data?.forEach { transaction ->
                        localDataSource.insertTransaction(
                            id = transaction.id,
                            reservationId = transaction.reservationId,
                            units = transaction.units,
                            amount = transaction.amount,
                            status = transaction.status,
                            timestamp = transaction.timestamp
                        )
                    }
                }

                return@withContext TransactionListResponse(
                    success = response.success,
                    transactions = response.data?.map { data ->
                        TransactionModel(
                            id = data.id,
                            reservationId = data.reservationId,
                            units = data.units,
                            amount = data.amount,
                            status = data.status,
                            timestamp = data.timestamp,
                            gridOperator = data.gridOperator
                        )
                    } ?: emptyList()
                )
            } catch (e: Exception) {
                Log.e("TransactionRepository", "Error fetching transactions: ${e.message}")
                // Try to fetch from local cache as fallback
                val cached = localDataSource.getAllTransactions()
                return@withContext TransactionListResponse(
                    success = false,
                    transactions = cached.map { entity ->
                        TransactionModel(
                            id = entity.id,
                            reservationId = entity.reservationId,
                            units = entity.units,
                            amount = entity.amount,
                            status = entity.status,
                            timestamp = entity.timestamp,
                            gridOperator = null
                        )
                    }
                )
            }
        }
    }

    /**
     * Get transaction details from remote API
     */
    suspend fun getTransactionDetails(transactionId: String): TransactionDetailResponse {
        return withContext(Dispatchers.IO) {
            try {
                val response = apiService.getTransactionDetails(transactionId)

                return@withContext TransactionDetailResponse(
                    success = response.success,
                    transaction = response.data?.let { data ->
                        TransactionModel(
                            id = data.id,
                            reservationId = data.reservationId,
                            units = data.units,
                            amount = data.amount,
                            status = data.status,
                            timestamp = data.timestamp,
                            gridOperator = null
                        )
                    }
                )
            } catch (e: Exception) {
                Log.e("TransactionRepository", "Error fetching details: ${e.message}")
                // Try local cache
                val cached = localDataSource.getTransaction(transactionId)
                return@withContext TransactionDetailResponse(
                    success = false,
                    transaction = cached?.let { entity ->
                        TransactionModel(
                            id = entity.id,
                            reservationId = entity.reservationId,
                            units = entity.units,
                            amount = entity.amount,
                            status = entity.status,
                            timestamp = entity.timestamp,
                            gridOperator = null
                        )
                    }
                )
            }
        }
    }

    /**
     * Get all cached transactions
     */
    suspend fun getCachedTransactions() = 
        withContext(Dispatchers.IO) {
            localDataSource.getAllTransactions()
        }

    /**
     * Clear all cached transactions
     */
    suspend fun clearCachedTransactions() = 
        withContext(Dispatchers.IO) {
            localDataSource.clearAll()
        }

    /**
     * Delete cached transaction
     */
    suspend fun deleteTransaction(transactionId: String) = 
        withContext(Dispatchers.IO) {
            localDataSource.deleteTransaction(transactionId)
        }
}

/**
 * Response wrappers for transaction operations
 */
data class TransactionProcessResponse(
    val success: Boolean,
    val message: String?,
    val transaction: TransactionModel?
)

data class TransactionListResponse(
    val success: Boolean,
    val transactions: List<TransactionModel>
)

data class TransactionDetailResponse(
    val success: Boolean,
    val transaction: TransactionModel?
)
