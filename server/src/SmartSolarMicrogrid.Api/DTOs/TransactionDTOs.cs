namespace SmartSolarMicrogrid.Api.DTOs
{
    /// <summary>
    /// Request to process energy transfer
    /// </summary>
    public class EnergyTransferRequest
    {
        public string ReservationId { get; set; } = string.Empty;
        public string QrToken { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response for energy transfer
    /// </summary>
    public class EnergyTransferResponse
    {
        public bool Success { get; set; }
        public TransactionDto? Data { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Transaction DTO
    /// </summary>
    public class TransactionDto
    {
        public string Id { get; set; } = string.Empty;
        public string ReservationId { get; set; } = string.Empty;
        public int Units { get; set; }
        public double Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? GridOperator { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Transaction Detail DTO
    /// </summary>
    public class TransactionDetailDto
    {
        public string Id { get; set; } = string.Empty;
        public string ReservationId { get; set; } = string.Empty;
        public string GridOperatorId { get; set; } = string.Empty;
        public string ProsumerId { get; set; } = string.Empty;
        public int Units { get; set; }
        public double Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    /// <summary>
    /// Transactions List Response
    /// </summary>
    public class TransactionsListResponse
    {
        public bool Success { get; set; }
        public List<TransactionDto>? Data { get; set; }
        public PaginationDto? Pagination { get; set; }
    }

    /// <summary>
    /// Transaction Detail Response
    /// </summary>
    public class TransactionDetailResponse
    {
        public bool Success { get; set; }
        public TransactionDetailDto? Data { get; set; }
    }

    /// <summary>
    /// Pagination DTO
    /// </summary>
    public class PaginationDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public long Total { get; set; }
    }
}
