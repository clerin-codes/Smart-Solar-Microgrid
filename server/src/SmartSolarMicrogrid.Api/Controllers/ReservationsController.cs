using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(
        IReservationService reservationService)
    {
        _reservationService = reservationService;
    }


    // ======================================================
    // 1. Create Reservation
    // ======================================================
    // POST: /api/reservations
    // Only Prosumer users can create reservations.

    // GET: /api/reservations
    // Grid Operators and Backoffice users can list all reservations.
    [HttpGet]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<IActionResult> GetAll()
    {
        var reservations =
            await _reservationService.GetAllAsync();

        return Ok(reservations);
    }

    [HttpPost]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> Create(
        [FromBody] CreateReservationDto request)
    {
        var prosumerNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.CreateAsync(
                prosumerNIC,
                request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = reservation.Id },
            reservation);
    }


    // ======================================================
    // 2. Get Reservation By ID
    // ======================================================
    // GET: /api/reservations/{id}
    // Authenticated users can access a reservation.
    //
    // Ownership/business access can be further controlled
    // inside the service layer.

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        string id)
    {
        var reservation =
            await _reservationService.GetByIdAsync(id);

        if (reservation == null)
        {
            return NotFound(new
            {
                message = "Reservation not found."
            });
        }

        return Ok(reservation);
    }


    // ======================================================
    // 3. Get My Reservations
    // ======================================================
    // GET: /api/reservations/my
    // Only Prosumer users can access their reservations.

    [HttpGet("my")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> GetMyReservations()
    {
        var prosumerNIC = GetCurrentUserNIC();

        var reservations =
            await _reservationService
                .GetMyReservationsAsync(prosumerNIC);

        return Ok(reservations);
    }


    // ======================================================
    // 4. Update Reservation
    // ======================================================
    // PUT: /api/reservations/{id}
    // Only the Prosumer who owns the reservation
    // can update it.

    [HttpPut("{id}")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateReservationDto request)
    {
        var prosumerNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.UpdateAsync(
                prosumerNIC,
                id,
                request);

        return Ok(reservation);
    }


    // ======================================================
    // 5. Cancel Reservation
    // ======================================================
    // DELETE: /api/reservations/{id}
    // Only the Prosumer who owns the reservation
    // can cancel it.

    [HttpDelete("{id}")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> Cancel(
        string id)
    {
        var prosumerNIC = GetCurrentUserNIC();

        await _reservationService.CancelAsync(
            prosumerNIC,
            id);

        return Ok(new
        {
            message =
                "Reservation cancelled successfully."
        });
    }


    // ======================================================
    // 6. Approve Reservation
    // ======================================================
    // POST: /api/reservations/{id}/approve
    // Only Grid Operators can approve reservations.

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> Approve(
        string id)
    {
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.ApproveAsync(
                operatorNIC,
                id);

        return Ok(reservation);
    }


    // ======================================================
    // 7. Verify QR Code
    // ======================================================
    // POST: /api/reservations/verify-qr
    // Only Grid Operators can verify QR codes.

    [HttpPost("verify-qr")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> VerifyQR(
        [FromBody] string qrToken)
    {
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.VerifyQRAsync(
                operatorNIC,
                qrToken);

        return Ok(reservation);
    }


    // ======================================================
    // 8. Complete Reservation / Transaction
    // ======================================================
    // POST: /api/reservations/{id}/complete
    // Only Grid Operators can complete transactions.

    [HttpPost("{id}/complete")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> Complete(
        string id)
    {
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.CompleteAsync(
                operatorNIC,
                id);

        return Ok(reservation);
    }


    // ======================================================
    // Helper Method
    // ======================================================
    // Get the NIC from the authenticated JWT token.

    private string GetCurrentUserNIC()
    {
        var nic =
            User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(nic))
        {
            throw new UnauthorizedAccessException(
                "User NIC could not be found in the authentication token.");
        }

        return nic;
    }
}