package lk.smartsolar.microgrid.ui.operator

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.repo.TransactionRepository
import android.util.Log

/**
 * ViewModel for Transaction management
 */
class TransactionViewModel(private val transactionRepository: TransactionRepository) : ViewModel() {

    private val _transactionState = MutableLiveData<TransactionState>()
    val transactionState: LiveData<TransactionState> = _transactionState

    private val _transactionList = MutableLiveData<List<TransactionModel>>()
    val transactionList: LiveData<List<TransactionModel>> = _transactionList

    private val _currentTransaction = MutableLiveData<TransactionModel?>()
    val currentTransaction: LiveData<TransactionModel?> = _currentTransaction

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private var currentPage = 1
    private val pageSize = 10

    init {
        _transactionState.value = TransactionState.Idle
    }

    /**
     * Process energy transfer after QR verification
     */
    fun processEnergyTransfer(reservationId: String, qrToken: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _transactionState.postValue(TransactionState.Processing)
                val response = transactionRepository.processEnergyTransfer(
                    reservationId,
                    qrToken
                )

                if (response.success) {
                    response.transaction?.let { transaction ->
                        _currentTransaction.postValue(transaction)
                        _transactionState.postValue(TransactionState.Success)
                        _error.postValue(null)
                    } ?: run {
                        _error.postValue("No transaction data returned")
                        _transactionState.postValue(TransactionState.Error)
                    }
                } else {
                    _error.postValue(response.message ?: "Failed to process transfer")
                    _transactionState.postValue(TransactionState.Error)
                }
            } catch (e: Exception) {
                Log.e("TransactionViewModel", "Error processing transfer: ${e.message}")
                _error.postValue(e.message ?: "Unknown error occurred")
                _transactionState.postValue(TransactionState.Error)
            }
        }
    }

    /**
     * Fetch transactions with pagination
     */
    fun fetchTransactions(page: Int = 1, statusFilter: String? = null) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _transactionState.postValue(TransactionState.Loading)
                currentPage = page
                val response = transactionRepository.getTransactions(page, pageSize, statusFilter)

                if (response.success) {
                    response.transactions?.let { transactions ->
                        _transactionList.postValue(transactions)
                        _transactionState.postValue(TransactionState.Success)
                        _error.postValue(null)
                    } ?: run {
                        _transactionList.postValue(emptyList())
                        _transactionState.postValue(TransactionState.Success)
                    }
                } else {
                    _error.postValue("Failed to fetch transactions")
                    _transactionState.postValue(TransactionState.Error)
                }
            } catch (e: Exception) {
                Log.e("TransactionViewModel", "Error fetching transactions: ${e.message}")
                _error.postValue(e.message ?: "Unknown error occurred")
                _transactionState.postValue(TransactionState.Error)
            }
        }
    }

    /**
     * Fetch transaction details
     */
    fun fetchTransactionDetails(transactionId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _transactionState.postValue(TransactionState.Loading)
                val response = transactionRepository.getTransactionDetails(transactionId)

                if (response.success) {
                    response.transaction?.let { transaction ->
                        _currentTransaction.postValue(transaction)
                        _transactionState.postValue(TransactionState.Success)
                        _error.postValue(null)
                    } ?: run {
                        _error.postValue("No transaction found")
                        _transactionState.postValue(TransactionState.Error)
                    }
                } else {
                    _error.postValue("Failed to fetch transaction details")
                    _transactionState.postValue(TransactionState.Error)
                }
            } catch (e: Exception) {
                Log.e("TransactionViewModel", "Error fetching details: ${e.message}")
                _error.postValue(e.message ?: "Unknown error occurred")
                _transactionState.postValue(TransactionState.Error)
            }
        }
    }

    /**
     * Load next page
     */
    fun loadNextPage(statusFilter: String? = null) {
        fetchTransactions(currentPage + 1, statusFilter)
    }

    /**
     * Load previous page
     */
    fun loadPreviousPage(statusFilter: String? = null) {
        if (currentPage > 1) {
            fetchTransactions(currentPage - 1, statusFilter)
        }
    }

    /**
     * Clear current transaction
     */
    fun clearCurrentTransaction() {
        _currentTransaction.value = null
    }

    /**
     * Clear error
     */
    fun clearError() {
        _error.value = null
    }
}

/**
 * Transaction Model
 */
data class TransactionModel(
    val id: String,
    val reservationId: String,
    val units: Int,
    val amount: Double,
    val status: String,
    val timestamp: String,
    val gridOperator: String?
)

/**
 * Transaction State
 */
enum class TransactionState {
    Idle,
    Loading,
    Processing,
    Success,
    Error
}
