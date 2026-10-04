using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;
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
        private readonly ILogger<QRController> _logger;

        /// <summary>
        /// Initialize QR Controller with QR Service
        /// </summary>
        public QRController(QRService qrService, ILogger<QRController> logger)
        {
            _qrService = qrService;
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
        [ProducesResponseType(typeof(VerifyQRResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> VerifyQRCode([FromBody] VerifyQRRequest request)
        {
            try
            {
                // Validate request
                if (string.IsNullOrEmpty(request.QrData) || string.IsNullOrEmpty(request.GridOperatorId))
                {
                    return BadRequest(new { success = false, message = "QR data and Grid Operator ID are required" });
                }

                // Verify QR code
                var verification = await _qrService.VerifyQRCodeAsync(request.QrData, request.GridOperatorId);

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
    }
}
