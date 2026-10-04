using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
using System.Security.Claims;

namespace SmartSolarMicrogrid.Api.Controllers
{
    /// <summary>
    /// Transactions Controller - Handles energy transfer transactions and transaction history
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public class TransactionsController : ControllerBase
    {
        private readonly TransactionService _transactionService;
        private readonly ILogger<TransactionsController> _logger;

        /// <summary>
        /// Initialize Transactions Controller
        /// </summary>
        public TransactionsController(TransactionService transactionService, ILogger<TransactionsController> logger)
        {
            _transactionService = transactionService;
            _logger = logger;
        }

        /// <summary>
        /// Process energy transfer after QR verification
        /// POST: /api/transactions/transfer
        /// </summary>
        [HttpPost("transfer")]
        [Authorize(Roles = "GridOperator")]
        [ProducesResponseType(typeof(EnergyTransferResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ProcessEnergyTransfer([FromBody] EnergyTransferRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.ReservationId) || string.IsNullOrEmpty(request.QrToken))
                {
                    return BadRequest(new { success = false, message = "Reservation ID and QR Token are required" });
                }

                // Process transfer
                var operatorNic = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException("Missing operator identity.");
                var transaction = await _transactionService.ProcessEnergyTransferAsync(request.ReservationId, request.QrToken, operatorNic);

                _logger.LogInformation($"Energy transfer completed. Transaction ID: {transaction.Id}");

                return Ok(new EnergyTransferResponse
                {
                    Success = true,
                    Data = new TransactionDto
                    {
                        Id = transaction.Id,
                        ReservationId = transaction.ReservationId,
                        Units = transaction.Units,
                        Amount = transaction.Amount,
                        Status = transaction.Status,
                        Timestamp = transaction.Timestamp,
                        GridOperator = transaction.GridOperatorId,
                        Message = "Energy transfer completed successfully"
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing energy transfer: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to process energy transfer", error = ex.Message });
            }
        }

        /// <summary>
        /// Get all transactions (with pagination and filtering)
        /// GET: /api/transactions?status=Completed&page=1
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(TransactionsListResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetAllTransactions([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                // Validate pagination
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 10;

                // Get transactions
                var result = await _transactionService.GetTransactionsAsync(status, page, pageSize);

                _logger.LogInformation($"Retrieved {result.Transactions.Count} transactions. Page: {page}");

                return Ok(new TransactionsListResponse
                {
                    Success = true,
                    Data = result.Transactions.Select(t => new TransactionDto
                    {
                        Id = t.Id,
                        ReservationId = t.ReservationId,
                        Units = t.Units,
                        Amount = t.Amount,
                        Status = t.Status,
                        Timestamp = t.Timestamp,
                        GridOperator = t.GridOperatorId
                    }).ToList(),
                    Pagination = new PaginationDto
                    {
                        Page = page,
                        PageSize = pageSize,
                        Total = result.Total
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving transactions: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to retrieve transactions", error = ex.Message });
            }
        }

        /// <summary>
        /// Get transaction details by ID
        /// GET: /api/transactions/{id}
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TransactionDetailResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetTransactionDetails(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest(new { success = false, message = "Transaction ID is required" });
                }

                var transaction = await _transactionService.GetTransactionByIdAsync(id);

                if (transaction == null)
                {
                    return NotFound(new { success = false, message = "Transaction not found" });
                }

                return Ok(new TransactionDetailResponse
                {
                    Success = true,
                    Data = new TransactionDetailDto
                    {
                        Id = transaction.Id,
                        ReservationId = transaction.ReservationId,
                        Units = transaction.Units,
                        Amount = transaction.Amount,
                        Status = transaction.Status,
                        Timestamp = transaction.Timestamp,
                        GridOperatorId = transaction.GridOperatorId,
                        ProsumerId = transaction.ProsumerId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving transaction details: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to retrieve transaction details", error = ex.Message });
            }
        }

        /// <summary>
        /// Update a transaction's status (Backoffice correction, e.g. Completed -> Disputed/Failed)
        /// PUT: /api/transactions/{id}/status
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Backoffice")]
        [ProducesResponseType(typeof(TransactionDetailResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateTransactionStatus(string id, [FromBody] UpdateTransactionStatusRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(request.Status))
                {
                    return BadRequest(new { success = false, message = "Transaction ID and new status are required" });
                }

                var allowedStatuses = new[] { "Completed", "Failed", "Pending", "Disputed" };
                if (!allowedStatuses.Contains(request.Status))
                {
                    return BadRequest(new { success = false, message = $"Status must be one of: {string.Join(", ", allowedStatuses)}" });
                }

                var transaction = await _transactionService.UpdateTransactionStatusAsync(id, request.Status);

                if (transaction == null)
                {
                    return NotFound(new { success = false, message = "Transaction not found" });
                }

                _logger.LogInformation($"Transaction {id} status updated to {request.Status}");

                return Ok(new TransactionDetailResponse
                {
                    Success = true,
                    Data = new TransactionDetailDto
                    {
                        Id = transaction.Id,
                        ReservationId = transaction.ReservationId,
                        Units = transaction.Units,
                        Amount = transaction.Amount,
                        Status = transaction.Status,
                        Timestamp = transaction.Timestamp,
                        GridOperatorId = transaction.GridOperatorId,
                        ProsumerId = transaction.ProsumerId
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating transaction status: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to update transaction status", error = ex.Message });
            }
        }
    }
}
