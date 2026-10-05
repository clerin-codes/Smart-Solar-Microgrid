/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: AccountController.cs
 * Purpose: Provides authenticated self-service profile, password,
 *          and account deactivation operations.
 */

using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

/// <summary>
/// Provides authenticated self-service account operations for the
/// currently signed-in user.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class AccountController : ControllerBase
{
    private readonly IUserService _userService;

    /// <summary>
    /// Initializes the account controller with the user-management service.
    /// </summary>
    /// <param name="userService">
    /// Service responsible for user and account-management operations.
    /// </param>
    public AccountController(
        IUserService userService)
    {
        // Store the account-management service used by self-service operations.
        _userService = userService;
    }

    /// <summary>
    /// Returns the authenticated user's account information.
    /// </summary>
    /// <returns>
    /// The authenticated user's safe profile information.
    /// </returns>
    [HttpGet("me")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        // Resolve the authenticated NIC and retrieve the matching user account.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService
                .GetByNICAsync(nic);

        return Ok(user);
    }

    /// <summary>
    /// Updates the editable profile information of the authenticated user.
    /// </summary>
    /// <param name="request">
    /// Updated full name, email address, and mobile number.
    /// </param>
    /// <returns>
    /// The updated safe user account information.
    /// </returns>
    [HttpPut("me")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateUserDto request)
    {
        // Update only the editable fields of the authenticated account.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService
                .UpdateAsync(
                    nic,
                    request);

        return Ok(user);
    }

    /// <summary>
    /// Allows an active Solar Prosumer to request deactivation
    /// of their own account.
    /// </summary>
    /// <returns>
    /// The updated account together with a confirmation message.
    /// </returns>
    [Authorize(Roles = "Prosumer")]
    [HttpPost("deactivation-request")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status403Forbidden)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestDeactivation()
    {
        // Move the authenticated active Prosumer into the deactivation-request state.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService
                .RequestOwnDeactivationAsync(
                    nic);

        return Ok(
            new
            {
                message =
                    "Account deactivation requested successfully.",

                user
            });
    }

    /// <summary>
    /// Changes the password of the currently authenticated account.
    /// </summary>
    /// <param name="request">
    /// Current password and strongly validated replacement password.
    /// </param>
    /// <returns>
    /// A confirmation message after the password has been changed.
    /// </returns>
    [HttpPost("change-password")]
    [ProducesResponseType(
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordDto request)
    {
        // Verify the current password and replace it with the validated new password.
        var nic =
            GetCurrentUserNic();

        await _userService
            .ChangePasswordAsync(
                nic,
                request);

        return Ok(
            new
            {
                message =
                    "Password changed successfully."
            });
    }

    /// <summary>
    /// Extracts the authenticated user's NIC from the JWT identity claim.
    /// </summary>
    /// <returns>
    /// The authenticated user's NIC.
    /// </returns>
    /// <exception cref="UnauthorizedAccessException">
    /// Thrown when the JWT does not contain the expected user identifier.
    /// </exception>
    private string GetCurrentUserNic()
    {
        // Read the immutable NIC identifier stored in the JWT at login.
        var nic =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(nic))
        {
            throw new UnauthorizedAccessException(
                "Authenticated user identifier is missing.");
        }

        return nic;
    }
}