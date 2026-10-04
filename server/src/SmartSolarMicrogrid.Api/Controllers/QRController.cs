using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using System.Security.Claims;

namespace SmartSolarMicrogrid.Api.Controllers
{
    /// <summary>
    /// QR Code Controller - Handles QR code generation and verification for energy transactions
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QRController : ControllerBase
    {
        private readonly QRService _qrService;
        private readonly IReservationService _reservationService;
        private readonly ILogger<QRController> _logger;

        /// <summary>
        /// Initialize QR Controller with QR Service
        /// </summary>
        public QRController(QRService qrService, ILogger<QRController> logger, IReservationService reservationService)
        {
            _qrService = qrService;
            _reservationService = reservationService;
            _logger = logger;
        }

        /// <summary>
        /// Generate QR code for approved reservation
        /// POST: /api/qr/generate
        /// </summary>
        [HttpPost("generate")]
        [ProducesResponseType(typeof(GenerateQRResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GenerateQRCode([FromBody] GenerateQRRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.ReservationId))
                {
                    return BadRequest(new { success = false, message = "Reservation ID is required" });
                }

                // Generate QR code
                var reservation = await _reservationService.GetByIdAsync(request.ReservationId);
                if (reservation == null)
                    return NotFound(new { success = false, message = "Reservation not found" });
                if (User.IsInRole("Prosumer") && reservation.ProsumerNIC != User.FindFirstValue(ClaimTypes.NameIdentifier))
                    return Forbid();
                var qrData = await _qrService.GenerateQRCodeAsync(request.ReservationId);

                _logger.LogInformation($"QR code generated for reservation: {request.ReservationId}");

                return Ok(new GenerateQRResponse
                {
                    Success = true,
                    QrCode = qrData.QrCodeImage,
                    QrData = new QRDataDto
                    {
                        ReservationId = qrData.ReservationId,
                        Token = qrData.Token,
                        ExpiresAt = qrData.ExpiresAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error generating QR code: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to generate QR code", error = ex.Message });
            }
        }

        /// <summary>
        /// Verify QR code before energy transfer
        /// POST: /api/qr/verify
        /// </summary>
        [HttpPost("verify")]
        [Authorize(Roles = "GridOperator")]
        [ProducesResponseType(typeof(VerifyQRResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> VerifyQRCode([FromBody] VerifyQRRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.QrData))
                {
                    return BadRequest(new { success = false, message = "QR data is required" });
                }

                // Verify QR code
                var operatorNic = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException("Missing operator identity.");
                var verification = await _qrService.VerifyQRCodeAsync(request.QrData, operatorNic);

                if (!verification.IsValid)
                {
                    return Ok(new VerifyQRResponse
                    {
                        Success = false,
                        Valid = false,
                        Message = "QR code is invalid or expired"
                    });
                }

                _logger.LogInformation($"QR code verified for reservation: {verification.ReservationId}");

                return Ok(new VerifyQRResponse
                {
                    Success = true,
                    Valid = true,
                    Data = new VerificationDataDto
                    {
                        ReservationId = verification.ReservationId,
                        ProsumerId = verification.ProsumerId,
                        StationId = verification.StationId,
                        Units = verification.Units,
                        TotalPrice = verification.TotalPrice,
                        SlotTime = verification.SlotTime,
                        Message = "QR verified successfully. Ready for energy transfer."
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error verifying QR code: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to verify QR code", error = ex.Message });
            }
        }

        /// <summary>
        /// Revoke an unused QR code (owning Prosumer, or an Operator/Admin)
        /// DELETE: /api/qr/{token}
        /// </summary>
        [HttpDelete("{token}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RevokeQRCode(string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { success = false, message = "QR token is required" });
                }

                var userNic = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? throw new UnauthorizedAccessException("Missing user identity.");

                var revoked = await _qrService.RevokeQRCodeAsync(token, userNic, User.IsInRole("Prosumer"));

                if (!revoked)
                {
                    return NotFound(new { success = false, message = "QR code not found, already used, or you are not authorized to revoke it" });
                }

                _logger.LogInformation($"QR code revoked: {token}");

                return Ok(new { success = true, message = "QR code revoked successfully" });
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error revoking QR code: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Failed to revoke QR code", error = ex.Message });
            }
        }
    }
}
