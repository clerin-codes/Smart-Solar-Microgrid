using SmartSolarMicrogrid.Api.Models;
using MongoDB.Driver;
using System.Security.Cryptography;
using System.Text;

namespace SmartSolarMicrogrid.Api.Services
{
    /// <summary>
    /// QR Service - Handles QR code generation, verification, and management
    /// </summary>
    public class QRService
    {
        private readonly IMongoCollection<QRVerification> _qrVerificationCollection;
        private readonly IMongoCollection<Reservation> _reservationCollection;
        private readonly IMongoCollection<Station> _stationCollection;
        private readonly ILogger<QRService> _logger;
        private const int QR_VALIDITY_HOURS = 2;

        /// <summary>
        /// Initialize QR Service with MongoDB collections
        /// </summary>
        public QRService(IMongoDatabase database, ILogger<QRService> logger)
        {
            _qrVerificationCollection = database.GetCollection<QRVerification>("QRVerifications");
            _reservationCollection = database.GetCollection<Reservation>("Reservations");
            _stationCollection = database.GetCollection<Station>("Stations");
            _logger = logger;
        }

        /// <summary>
        /// Generate QR code for approved reservation
        /// </summary>
        public async Task<dynamic> GenerateQRCodeAsync(string reservationId)
        {
            try
            {
                // Get reservation
                var reservation = await _reservationCollection.Find(r => r.Id == reservationId).FirstOrDefaultAsync();
                if (reservation == null)
                    throw new Exception("Reservation not found");

                if (reservation.Status != "Approved")
                    throw new Exception("Reservation must be approved before generating QR code");

                // Check if QR already exists for this reservation
                var existingQR = await _qrVerificationCollection
                    .Find(q => q.ReservationId == reservationId)
                    .FirstOrDefaultAsync();

                if (existingQR != null)
                {
                    _logger.LogInformation($"Using existing QR code for reservation: {reservationId}");
                    return new
                    {
                        ReservationId = existingQR.ReservationId,
                        Token = existingQR.Token,
                        ExpiresAt = existingQR.ExpiresAt,
                        QrCodeImage = GenerateQRImage(existingQR.Token)
                    };
                }

                // Generate unique token
                var token = GenerateUniqueToken(reservationId);
                var expiresAt = DateTime.UtcNow.AddHours(QR_VALIDITY_HOURS);

                // Create QR verification record
                var qrVerification = new QRVerification
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    ReservationId = reservationId,
                    Token = token,
                    ExpiresAt = expiresAt,
                    CreatedAt = DateTime.UtcNow,
                    VerifiedAt = null
                };

                await _qrVerificationCollection.InsertOneAsync(qrVerification);

                _logger.LogInformation($"QR code generated for reservation: {reservationId}");

                return new
                {
                    ReservationId = qrVerification.ReservationId,
                    Token = qrVerification.Token,
                    ExpiresAt = qrVerification.ExpiresAt,
                    QrCodeImage = GenerateQRImage(token)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating QR code: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Verify QR code before energy transfer
        /// </summary>
        public async Task<dynamic> VerifyQRCodeAsync(string qrData, string gridOperatorId)
        {
            try
            {
                // Find QR verification record
                var qrVerification = await _qrVerificationCollection
                    .Find(q => q.Token == qrData)
                    .FirstOrDefaultAsync();

                if (qrVerification == null)
                {
                    _logger.LogWarning($"Invalid QR code attempted: {qrData}");
                    return new { IsValid = false, Message = "QR code not found" };
                }

                // Check if expired
                if (DateTime.UtcNow > qrVerification.ExpiresAt)
                {
                    _logger.LogWarning($"Expired QR code attempted: {qrData}");
                    return new { IsValid = false, Message = "QR code has expired" };
                }

                // Get reservation details
                var reservation = await _reservationCollection
                    .Find(r => r.Id == qrVerification.ReservationId)
                    .FirstOrDefaultAsync();

                if (reservation == null || reservation.Status != "Approved")
                    return new { IsValid = false, Message = "Invalid reservation" };

                // Get station details
                var station = await _stationCollection
                    .Find(s => s.Id == reservation.StationId)
                    .FirstOrDefaultAsync();

                if (station == null)
                    return new { IsValid = false, Message = "Invalid station" };

                // Mark as verified
                qrVerification.VerifiedAt = DateTime.UtcNow;
                await _qrVerificationCollection.ReplaceOneAsync(q => q.Id == qrVerification.Id, qrVerification);

                _logger.LogInformation($"QR code verified successfully for reservation: {qrVerification.ReservationId}");

                return new
                {
                    IsValid = true,
                    ReservationId = qrVerification.ReservationId,
                    ProsumerId = reservation.UserId,
                    StationId = reservation.StationId,
                    Units = reservation.Units,
                    TotalPrice = reservation.TotalPrice,
                    SlotTime = reservation.ReservationDate,
                    Message = "QR verified successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying QR code: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Generate unique token for QR code
        /// </summary>
        private string GenerateUniqueToken(string reservationId)
        {
            using (var sha256 = SHA256.Create())
            {
                var input = $"{reservationId}-{Guid.NewGuid()}-{DateTime.UtcNow.Ticks}";
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
                return Convert.ToBase64String(hash).Substring(0, 32);
            }
        }

        /// <summary>
        /// Generate QR code image (returns base64)
        /// </summary>
        private string GenerateQRImage(string token)
        {
            // For now, return a placeholder. In production, use QRCoder NuGet package
            // Example: var qrGenerator = new QRCodeGenerator();
            // var qrCodeData = qrGenerator.CreateQrCode(token, QRCodeGenerator.ECCLevel.Q);
            // var qrCode = new PngByteQRCode(qrCodeData);
            // var qrCodeImage = qrCode.GetGraphic(20);
            
            return "qr_code_image_base64_placeholder";
        }
    }
}
