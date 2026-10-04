namespace SmartSolarMicrogrid.Api.DTOs
{
    /// <summary>
    /// Request to generate QR code
    /// </summary>
    public class GenerateQRRequest
    {
        public string ReservationId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response for QR generation
    /// </summary>
    public class GenerateQRResponse
    {
        public bool Success { get; set; }
        public string? QrCode { get; set; }
        public QRDataDto? QrData { get; set; }
    }

    /// <summary>
    /// QR Data DTO
    /// </summary>
    public class QRDataDto
    {
        public string ReservationId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    /// <summary>
    /// Request to verify QR code
    /// </summary>
    public class VerifyQRRequest
    {
        public string QrData { get; set; } = string.Empty;
        public string GridOperatorId { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response for QR verification
    /// </summary>
    public class VerifyQRResponse
    {
        public bool Success { get; set; }
        public bool Valid { get; set; }
        public VerificationDataDto? Data { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Verification Data DTO
    /// </summary>
    public class VerificationDataDto
    {
        public string ReservationId { get; set; } = string.Empty;
        public string ProsumerId { get; set; } = string.Empty;
        public string StationId { get; set; } = string.Empty;
        public int? Units { get; set; }
        public double? TotalPrice { get; set; }
        public string SlotTime { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
