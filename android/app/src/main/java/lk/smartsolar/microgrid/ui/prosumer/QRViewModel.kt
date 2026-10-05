package lk.smartsolar.microgrid.ui.prosumer

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import lk.smartsolar.microgrid.data.repo.QRRepository
import android.util.Log

/**
 * ViewModel for QR Code generation and management
 */
class QRViewModel(private val qrRepository: QRRepository) : ViewModel() {

    private val _qrGenerationState = MutableLiveData<QRGenerationState>()
    val qrGenerationState: LiveData<QRGenerationState> = _qrGenerationState

    private val _qrData = MutableLiveData<QRDataModel?>()
    val qrData: LiveData<QRDataModel?> = _qrData

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    init {
        _qrGenerationState.value = QRGenerationState.Idle
    }

    /**
     * Generate QR code for a reservation
     */
    fun generateQRCode(reservationId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                _qrGenerationState.postValue(QRGenerationState.Loading)
                val qrResponse = qrRepository.generateQRCode(reservationId)

                if (qrResponse.success) {
                    val qrModel = QRDataModel(
                        token = qrResponse.qrData?.token ?: "",
                        base64Image = qrResponse.base64QrCode ?: "",
                        expiresAt = qrResponse.qrData?.expiresAt ?: ""
                    )
                    _qrData.postValue(qrModel)
                    _qrGenerationState.postValue(QRGenerationState.Success)
                    _error.postValue(null)
                } else {
                    _error.postValue("Failed to generate QR code")
                    _qrGenerationState.postValue(QRGenerationState.Error)
                }
            } catch (e: Exception) {
                Log.e("QRViewModel", "Error generating QR: ${e.message}")
                _error.postValue(e.message ?: "Unknown error occurred")
                _qrGenerationState.postValue(QRGenerationState.Error)
            }
        }
    }

    /**
     * Clear current QR data
     */
    fun clearQRData() {
        _qrData.value = null
        _qrGenerationState.value = QRGenerationState.Idle
        _error.value = null
    }

    /**
     * Retry QR generation
     */
    fun retryGeneration(reservationId: String) {
        clearQRData()
        generateQRCode(reservationId)
    }
}

/**
 * QR Data Model
 */
data class QRDataModel(
    val token: String,
    val base64Image: String,
    val expiresAt: String
)

/**
 * QR Generation State
 */
enum class QRGenerationState {
    Idle,
    Loading,
    Success,
    Error
}
