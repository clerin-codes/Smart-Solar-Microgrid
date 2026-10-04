package lk.smartsolar.microgrid.data.remote.dto.qr

import com.google.gson.annotations.SerializedName

// Request DTOs
data class GenerateQRRequest(
    @SerializedName("reservationId")
    val reservationId: String
)

data class VerifyQRRequest(
    @SerializedName("qrData")
    val qrData: String,
    @SerializedName("gridOperatorId")
    val gridOperatorId: String
)

// Response DTOs
data class QRResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val qrData: QRDataDto?,
    @SerializedName("base64QrCode")
    val base64QrCode: String?,
    @SerializedName("message")
    val message: String?
)

data class QRDataDto(
    @SerializedName("token")
    val token: String,
    @SerializedName("expiresAt")
    val expiresAt: String
)

data class VerifyQRResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("valid")
    val valid: Boolean,
    @SerializedName("data")
    val verificationData: VerificationDataDto?,
    @SerializedName("message")
    val message: String?
)

data class VerificationDataDto(
    @SerializedName("prosumerId")
    val prosumerId: String,
    @SerializedName("stationId")
    val stationId: String,
    @SerializedName("energyUnits")
    val energyUnits: Int,
    @SerializedName("amount")
    val amount: Double
)
