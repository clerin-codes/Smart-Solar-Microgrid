/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AccountController.cs
 * Purpose: Provides authenticated self-service profile, password and deactivation operations.
 */

using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Produces("application/json")]
public class AccountController : ControllerBase
{
    private readonly IUserService _userService;

    public AccountController(IUserService userService)
    {
        // Store the account-management service used by self-service operations.
        _userService = userService;
    }

    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        // Resolve the authenticated NIC and return only safe account information.
        var nic = GetCurrentUserNic();
        var user = await _userService.GetByNICAsync(nic);

        return Ok(user);
    }

    [HttpPut("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateUserDto request)
    {
        // Update only the editable fields of the authenticated account.
        var nic = GetCurrentUserNic();

        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    [Authorize(Roles = "Prosumer")]
    [HttpPost("deactivation-request")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestDeactivation()
    {
        // Move the authenticated active Prosumer into the deactivation-request state.
        var nic = GetCurrentUserNic();

        var user =
            await _userService
                .RequestOwnDeactivationAsync(nic);

        return Ok(
            new
            {
                message =
                    "Account deactivation requested successfully.",

                user
            });
    }

    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordDto request)
    {
        // Verify the current password and replace it with a strongly validated new password.
        var nic = GetCurrentUserNic();

        await _userService.ChangePasswordAsync(
            nic,
            request);

        return Ok(
            new
            {
                message =
                    "Password changed successfully."
            });
    }

    private string GetCurrentUserNic()
    {
        // Read the immutable NIC identifier inserted into the JWT at login.
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