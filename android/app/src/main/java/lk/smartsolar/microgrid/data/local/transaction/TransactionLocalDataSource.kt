package lk.smartsolar.microgrid.data.local.transaction

import android.util.Log
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import androidx.room.Delete
import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Local data source for Transaction operations using Room database
 */
class TransactionLocalDataSource(private val transactionDao: TransactionDao) {

    /**
     * Insert or update transaction
     */
    suspend fun insertTransaction(
        id: String,
        reservationId: String,
        units: Int,
        amount: Double,
        status: String,
        timestamp: String
    ) {
        try {
            val entity = TransactionEntity(
                id = id,
                reservationId = reservationId,
                units = units,
                amount = amount,
                status = status,
                timestamp = timestamp,
                createdAt = System.currentTimeMillis()
            )
            transactionDao.insert(entity)
            Log.d("TransactionLocalDataSource", "Transaction inserted: $id")
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error inserting transaction: ${e.message}")
        }
    }

    /**
     * Get single transaction
     */
    suspend fun getTransaction(id: String): TransactionEntity? {
        return try {
            transactionDao.getTransactionById(id)
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error getting transaction: ${e.message}")
            null
        }
    }

    /**
     * Get all transactions
     */
    suspend fun getAllTransactions(): List<TransactionEntity> {
        return try {
            transactionDao.getAllTransactions()
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error getting all transactions: ${e.message}")
            emptyList()
        }
    }

    /**
     * Get transactions by status
     */
    suspend fun getTransactionsByStatus(status: String): List<TransactionEntity> {
        return try {
            transactionDao.getTransactionsByStatus(status)
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error getting transactions by status: ${e.message}")
            emptyList()
        }
    }

    /**
     * Get transactions by reservation
     */
    suspend fun getTransactionsByReservation(reservationId: String): List<TransactionEntity> {
        return try {
            transactionDao.getTransactionsByReservationId(reservationId)
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error getting transactions by reservation: ${e.message}")
            emptyList()
        }
    }

    /**
     * Update transaction
     */
    suspend fun updateTransaction(entity: TransactionEntity) {
        try {
            transactionDao.update(entity)
            Log.d("TransactionLocalDataSource", "Transaction updated: ${entity.id}")
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error updating transaction: ${e.message}")
        }
    }

    /**
     * Delete transaction
     */
    suspend fun deleteTransaction(id: String) {
        try {
            transactionDao.deleteById(id)
            Log.d("TransactionLocalDataSource", "Transaction deleted: $id")
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error deleting transaction: ${e.message}")
        }
    }

    /**
     * Clear all transactions
     */
    suspend fun clearAll() {
        try {
            transactionDao.deleteAll()
            Log.d("TransactionLocalDataSource", "All transactions cleared")
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error clearing transactions: ${e.message}")
        }
    }

    /**
     * Get transaction count
     */
    suspend fun getTransactionCount(): Int {
        return try {
            transactionDao.getCount()
        } catch (e: Exception) {
            Log.e("TransactionLocalDataSource", "Error getting count: ${e.message}")
            0
        }
    }
}

/**
 * Transaction Entity for Room database
 */
@Entity(tableName = "transactions")
data class TransactionEntity(
    @PrimaryKey
    val id: String,
    val reservationId: String,
    val units: Int,
    val amount: Double,
    val status: String,
    val timestamp: String,
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Transaction DAO (Data Access Object)
 */
@Dao
interface TransactionDao {
    @Insert
    suspend fun insert(transaction: TransactionEntity)

    @Update
    suspend fun update(transaction: TransactionEntity)

    @Delete
    suspend fun delete(transaction: TransactionEntity)

    @Query("DELETE FROM transactions WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM transactions")
    suspend fun deleteAll()

    @Query("SELECT * FROM transactions WHERE id = :id LIMIT 1")
    suspend fun getTransactionById(id: String): TransactionEntity?

    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    suspend fun getAllTransactions(): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE status = :status ORDER BY timestamp DESC")
    suspend fun getTransactionsByStatus(status: String): List<TransactionEntity>

    @Query("SELECT * FROM transactions WHERE reservationId = :reservationId ORDER BY timestamp DESC")
    suspend fun getTransactionsByReservationId(reservationId: String): List<TransactionEntity>

    @Query("SELECT COUNT(*) FROM transactions")
    suspend fun getCount(): Int
}
