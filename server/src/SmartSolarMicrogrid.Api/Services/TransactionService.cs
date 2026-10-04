using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using MongoDB.Bson;
using MongoDB.Driver;

namespace SmartSolarMicrogrid.Api.Services
{
    /// <summary>
    /// Transaction Service - Handles energy transfer transactions and ledger management
    /// </summary>
    public class TransactionService
    {
        private readonly IMongoCollection<Transaction> _transactionCollection;
        private readonly IMongoCollection<QRVerification> _qrVerificationCollection;
        private readonly IMongoCollection<EnergyReservation> _reservationCollection;
        private readonly IReservationService _reservationService;
        private readonly ILogger<TransactionService> _logger;

        /// <summary>
        /// Initialize Transaction Service
        /// </summary>
        public TransactionService(IMongoDatabase database, ILogger<TransactionService> logger, IReservationService reservationService)
        {
            _transactionCollection = database.GetCollection<Transaction>("Transactions");
            _qrVerificationCollection = database.GetCollection<QRVerification>("QRVerifications");
            _reservationCollection = database.GetCollection<EnergyReservation>("EnergyReservation");
            _reservationService = reservationService;
            _logger = logger;
        }

        /// <summary>
        /// Process energy transfer after QR verification
        /// </summary>
        public async Task<Transaction> ProcessEnergyTransferAsync(string reservationId, string qrToken, string gridOperatorNic)
        {
            try
            {
                // Validate QR token
                var qrVerification = await _qrVerificationCollection
                    .Find(q => q.Token == qrToken && q.ReservationId == reservationId)
                    .FirstOrDefaultAsync();

                if (qrVerification == null)
                    throw new Exception("Invalid QR token");

                if (DateTime.UtcNow > qrVerification.ExpiresAt)
                    throw new Exception("QR code has expired");

                if (qrVerification.VerifiedAt == null)
                    throw new InvalidOperationException("QR code must be verified before transfer.");

                // Get reservation
                var reservation = await _reservationCollection
                    .Find(r => r.Id == reservationId)
                    .FirstOrDefaultAsync();

                if (reservation == null || reservation.Status != ReservationStatus.Approved || reservation.QRToken != qrToken)
                    throw new Exception("Invalid or unapproved reservation");

                // Create transaction record
                var transaction = new Transaction
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    ReservationId = reservationId,
                    GridOperatorId = gridOperatorNic,
                    ProsumerId = reservation.ProsumerNIC,
                    // Metered energy and payment data are not part of the reservation model.
                    Units = null,
                    Amount = null,
                    Status = "Completed",
                    Timestamp = DateTime.UtcNow
                };

                // Use the existing workflow to validate verification, release the slot lock,
                // and record the authenticated operator and completion timestamp.
                await _reservationService.CompleteAsync(gridOperatorNic, reservationId);

                await _transactionCollection.InsertOneAsync(transaction);

                _logger.LogInformation($"Energy transfer completed. Transaction ID: {transaction.Id}");

                return transaction;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing energy transfer: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get all transactions with pagination
        /// </summary>
        public async Task<(List<Transaction> Transactions, long Total)> GetTransactionsAsync(string? status, int page, int pageSize)
        {
            try
            {
                var filter = Builders<Transaction>.Filter.Empty;

                // Filter by status if provided
                if (!string.IsNullOrEmpty(status))
                {
                    filter = Builders<Transaction>.Filter.Eq(t => t.Status, status);
                }

                var total = await _transactionCollection.CountDocumentsAsync(filter);

                var transactions = await _transactionCollection.Find(filter)
                    .SortByDescending(t => t.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Limit(pageSize)
                    .ToListAsync();

                return (transactions, total);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving transactions: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Update the status of an existing transaction (Backoffice correction, e.g. Completed -> Disputed/Failed)
        /// </summary>
        public async Task<Transaction?> UpdateTransactionStatusAsync(string transactionId, string newStatus)
        {
            try
            {
                var update = Builders<Transaction>.Update.Set(t => t.Status, newStatus);

                var updated = await _transactionCollection.FindOneAndUpdateAsync(
                    t => t.Id == transactionId,
                    update,
                    new FindOneAndUpdateOptions<Transaction> { ReturnDocument = ReturnDocument.After });

                if (updated != null)
                    _logger.LogInformation($"Transaction {transactionId} status updated to {newStatus}");

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating transaction status: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Get transaction by ID
        /// </summary>
        public async Task<Transaction?> GetTransactionByIdAsync(string transactionId)
        {
            try
            {
                return await _transactionCollection
                    .Find(t => t.Id == transactionId)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving transaction: {ex.Message}");
                throw;
            }
        }
    }
}
