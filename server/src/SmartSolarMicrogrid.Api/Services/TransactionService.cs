using SmartSolarMicrogrid.Api.Models;
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
        private readonly IMongoCollection<Reservation> _reservationCollection;
        private readonly ILogger<TransactionService> _logger;

        /// <summary>
        /// Initialize Transaction Service
        /// </summary>
        public TransactionService(IMongoDatabase database, ILogger<TransactionService> logger)
        {
            _transactionCollection = database.GetCollection<Transaction>("Transactions");
            _qrVerificationCollection = database.GetCollection<QRVerification>("QRVerifications");
            _reservationCollection = database.GetCollection<Reservation>("Reservations");
            _logger = logger;
        }

        /// <summary>
        /// Process energy transfer after QR verification
        /// </summary>
        public async Task<Transaction> ProcessEnergyTransferAsync(string reservationId, string qrToken)
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

                // Get reservation
                var reservation = await _reservationCollection
                    .Find(r => r.Id == reservationId)
                    .FirstOrDefaultAsync();

                if (reservation == null || reservation.Status != "Approved")
                    throw new Exception("Invalid or unapproved reservation");

                // Create transaction record
                var transaction = new Transaction
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    ReservationId = reservationId,
                    GridOperatorId = "gridop_001", // Will be set from authenticated user
                    ProsumerId = reservation.UserId,
                    Units = reservation.Units,
                    Amount = reservation.TotalPrice,
                    Status = "Completed",
                    Timestamp = DateTime.UtcNow
                };

                await _transactionCollection.InsertOneAsync(transaction);

                // Update reservation status
                reservation.Status = "Completed";
                await _reservationCollection.ReplaceOneAsync(r => r.Id == reservationId, reservation);

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
        public async Task<dynamic> GetTransactionsAsync(string? status, int page, int pageSize)
        {
            try
            {
                var query = _transactionCollection.AsQueryable();

                // Filter by status if provided
                if (!string.IsNullOrEmpty(status))
                {
                    query = query.Where(t => t.Status == status);
                }

                var total = await _transactionCollection.CountDocumentsAsync(
                    string.IsNullOrEmpty(status) ? new BsonDocument() : 
                    new BsonDocument("Status", status)
                );

                var transactions = await query
                    .OrderByDescending(t => t.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new
                {
                    Transactions = transactions,
                    Total = total
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving transactions: {ex.Message}");
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
