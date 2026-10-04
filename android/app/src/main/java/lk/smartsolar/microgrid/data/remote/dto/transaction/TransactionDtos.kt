package lk.smartsolar.microgrid.data.remote.dto.transaction

import com.google.gson.annotations.SerializedName

// Request DTOs
data class EnergyTransferRequest(
    @SerializedName("reservationId")
    val reservationId: String,
    @SerializedName("qrToken")
    val qrToken: String
)

// Response DTOs
data class TransactionResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: TransactionDto?,
    @SerializedName("message")
    val message: String?
)

data class TransactionsListResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: List<TransactionDto>?,
    @SerializedName("pagination")
    val pagination: PaginationDto?,
    @SerializedName("message")
    val message: String?
)

data class TransactionDetailResponse(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: TransactionDetailDto?,
    @SerializedName("message")
    val message: String?
)

data class TransactionDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("reservationId")
    val reservationId: String,
    @SerializedName("units")
    val units: Int,
    @SerializedName("amount")
    val amount: Double,
    @SerializedName("status")
    val status: String,
    @SerializedName("timestamp")
    val timestamp: String,
    @SerializedName("gridOperator")
    val gridOperator: String?
)

data class TransactionDetailDto(
    @SerializedName("id")
    val id: String,
    @SerializedName("reservationId")
    val reservationId: String,
    @SerializedName("gridOperatorId")
    val gridOperatorId: String,
    @SerializedName("prosumerId")
    val prosumerId: String,
    @SerializedName("units")
    val units: Int,
    @SerializedName("amount")
    val amount: Double,
    @SerializedName("status")
    val status: String,
    @SerializedName("timestamp")
    val timestamp: String
)

data class PaginationDto(
    @SerializedName("page")
    val page: Int,
    @SerializedName("pageSize")
    val pageSize: Int,
    @SerializedName("total")
    val total: Long
)
