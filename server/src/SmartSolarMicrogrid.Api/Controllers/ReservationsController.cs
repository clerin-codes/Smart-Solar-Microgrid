/*
 * File: ReservationsController.cs
 * Project: Smart Solar Microgrid
 * Description: Exposes reservation workflow endpoints for prosumers and grid operators.
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

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
        // Responsible: Clerin - IT23402584
        // Store the reservation workflow service used by each endpoint.
        _reservationService = reservationService;
    }


    // ======================================================
    // 1. Create Reservation
    // ======================================================
    // POST: /api/reservations
    // Only Prosumer users can create reservations.

    [HttpPost]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> Create(
        [FromBody] CreateReservationDto request)
    {
        // Responsible: Clerin - IT23402584
        // Create a reservation for the authenticated prosumer.
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
    // 2. Get All Reservations
    // ======================================================
    // GET: /api/reservations
    // Only Grid Operators can access all reservations.

    [HttpGet]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> GetAllReservations()
    {
        // Responsible: Clerin - IT23402584
        // Return all reservations to an authenticated grid operator.
        var reservations =
            await _reservationService
                .GetAllReservationsAsync();

        return Ok(reservations);
    }


    // ======================================================
    // 3. Get Reservation By ID
    // ======================================================
    // GET: /api/reservations/{id}
    // Authenticated users can access a reservation.
    //
    // Ownership/business access can be further controlled
    // inside the service layer.

    [HttpGet("{id}")]
    [Authorize(Roles = "Prosumer,GridOperator")]
    public async Task<IActionResult> GetById(
        string id)
    {
        // Responsible: Clerin - IT23402584
        // Return the reservation identified by the route value when it exists.
        var reservation =
            await _reservationService.GetByIdAsync(id);

        if (reservation == null)
        {
            return NotFound(new
            {
                message = "Reservation not found."
            });
        }

        if (User.IsInRole("Prosumer") &&
            reservation.ProsumerNIC != GetCurrentUserNIC())
        {
            return Forbid();
        }

        return Ok(reservation);
    }


    // ======================================================
    // 4. Get My Reservations
    // ======================================================
    // GET: /api/reservations/my
    // Only Prosumer users can access their reservations.

    [HttpGet("my")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> GetMyReservations()
    {
        // Responsible: Clerin - IT23402584
        // Return reservations belonging to the authenticated prosumer.
        var prosumerNIC = GetCurrentUserNIC();

        var reservations =
            await _reservationService
                .GetMyReservationsAsync(prosumerNIC);

        return Ok(reservations);
    }


    // ======================================================
    // 5. Update Reservation
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
        // Responsible: Clerin - IT23402584
        // Move an authenticated prosumer's reservation to the requested slot.
        var prosumerNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.UpdateAsync(
                prosumerNIC,
                id,
                request);

        return Ok(reservation);
    }


    // ======================================================
    // 6. Cancel Reservation
    // ======================================================
    // DELETE: /api/reservations/{id}
    // Only the Prosumer who owns the reservation
    // can cancel it.

    [HttpDelete("{id}")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> Cancel(
        string id)
    {
        // Responsible: Clerin - IT23402584
        // Cancel the authenticated prosumer's reservation.
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
    // 7. Approve Reservation
    // ======================================================
    // POST: /api/reservations/{id}/approve
    // Only Grid Operators can approve reservations.

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> Approve(
        string id)
    {
        // Responsible: Thuverakan - IT23281332
        // Approve a pending reservation as the authenticated grid operator.
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.ApproveAsync(
                operatorNIC,
                id);

        return Ok(reservation);
    }

    // ======================================================
    // 8. Reject Reservation
    // ======================================================
    // POST: /api/reservations/{id}/reject
    // Only Grid Operators can reject pending reservations.

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> Reject(
        string id)
    {
        // Responsible: Clerin - IT23402584
        // Reject a pending reservation as the authenticated grid operator.
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.RejectAsync(
                operatorNIC,
                id);

        return Ok(reservation);
    }


    // ======================================================
    // 8. Verify QR Code
    // ======================================================
    // POST: /api/reservations/verify-qr
    // Only Grid Operators can verify QR codes.

    [HttpPost("verify-qr")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> VerifyQR(
        [FromBody] string qrToken)
    {
        // Responsible: Thuverakan - IT23281332
        // Verify a reservation QR token as the authenticated grid operator.
        var operatorNIC = GetCurrentUserNIC();

        var reservation =
            await _reservationService.VerifyQRAsync(
                operatorNIC,
                qrToken);

        return Ok(reservation);
    }


    // ======================================================
    // 9. Complete Reservation / Transaction
    // ======================================================
    // POST: /api/reservations/{id}/complete
    // Only Grid Operators can complete transactions.

    [HttpPost("{id}/complete")]
    [Authorize(Roles = "GridOperator")]
    public async Task<IActionResult> Complete(
        string id)
    {
        // Responsible: Thuverakan - IT23281332
        // Complete a verified energy transfer as the authenticated grid operator.
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
        // Responsible: Clerin - IT23402584
        // Read and validate the authenticated user's NIC claim.
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
