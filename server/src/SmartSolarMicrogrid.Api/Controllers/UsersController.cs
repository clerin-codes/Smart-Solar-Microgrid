/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: UsersController.cs
 * Purpose: Provides Backoffice-only user and Prosumer administration endpoints,
 *          including account creation, profile management, activation,
 *          deactivation, and reactivation.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Controllers;

/// <summary>
/// Provides administrative user-management operations that are restricted
/// to authenticated Backoffice users.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Backoffice")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    /// <summary>
    /// Initializes the controller with the user-management service.
    /// </summary>
    /// <param name="userService">
    /// Service responsible for user and Prosumer account-management operations.
    /// </param>
    public UsersController(
        IUserService userService)
    {
        // Store the account-management service used by all Backoffice user operations.
        _userService = userService;
    }

    /// <summary>
    /// Retrieves all managed accounts with optional role and account-status filters.
    /// </summary>
    /// <param name="role">
    /// Optional user-role filter.
    /// </param>
    /// <param name="status">
    /// Optional account lifecycle-status filter.
    /// </param>
    /// <returns>
    /// A collection of users matching the supplied filters.
    /// </returns>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] UserRole? role = null,
        [FromQuery] AccountStatus? status = null)
    {
        // Retrieve managed accounts using the optional role and lifecycle-status filters.
        var users =
            await _userService.GetAllAsync(
                role,
                status);

        return Ok(users);
    }

    /// <summary>
    /// Retrieves Prosumer registrations that are waiting for Backoffice activation.
    /// </summary>
    /// <returns>
    /// A collection of pending Prosumer accounts.
    /// </returns>
    [HttpGet("pending-activations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPendingActivations()
    {
        // Retrieve pending Prosumer registrations that require Backoffice approval.
        var users =
            await _userService.GetPendingActivationsAsync();

        return Ok(users);
    }

    /// <summary>
    /// Retrieves Prosumer accounts that have requested deactivation.
    /// </summary>
    /// <returns>
    /// A collection of pending deactivation requests.
    /// </returns>
    [HttpGet("deactivation-requests")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDeactivationRequests()
    {
        // Retrieve Prosumer deactivation requests awaiting Backoffice finalization.
        var users =
            await _userService.GetDeactivationRequestsAsync();

        return Ok(users);
    }

    /// <summary>
    /// Retrieves a single managed account using the NIC as the primary identifier.
    /// </summary>
    /// <param name="nic">
    /// National Identity Card number of the requested account.
    /// </param>
    /// <returns>
    /// The matching user account.
    /// </returns>
    [HttpGet("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByNIC(
        string nic)
    {
        // Retrieve the requested account using NIC as the unique account identifier.
        var user =
            await _userService.GetByNICAsync(nic);

        return Ok(user);
    }

    /// <summary>
    /// Creates a new Backoffice or Grid Operator web account.
    /// </summary>
    /// <param name="request">
    /// Account details and initial password supplied by Backoffice.
    /// </param>
    /// <returns>
    /// The newly created account.
    /// </returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserDto request)
    {
        // Create a Backoffice or Grid Operator account using the supplied initial credentials.
        var user =
            await _userService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetByNIC),
            new
            {
                nic = user.NIC
            },
            user);
    }

    /// <summary>
    /// Updates the editable profile information of a managed account.
    /// </summary>
    /// <param name="nic">
    /// National Identity Card number of the account to update.
    /// </param>
    /// <param name="request">
    /// Updated account information.
    /// </param>
    /// <returns>
    /// The updated account.
    /// </returns>
    [HttpPut("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        string nic,
        [FromBody] UpdateUserDto request)
    {
        // Update only the account fields that are permitted to change through Backoffice.
        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    /// <summary>
    /// Activates a pending Prosumer registration.
    /// </summary>
    /// <param name="nic">
    /// NIC of the pending Prosumer account.
    /// </param>
    /// <returns>
    /// The activated account and a success message.
    /// </returns>
    [HttpPost("{nic}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(
        string nic)
    {
        // Approve the pending Prosumer registration and enable account authentication.
        var user =
            await _userService.ActivateAsync(nic);

        return Ok(
            new
            {
                message =
                    "Account activated successfully.",

                user
            });
    }

    /// <summary>
    /// Deactivates an account or finalizes a Prosumer deactivation request.
    /// </summary>
    /// <param name="nic">
    /// NIC of the account to deactivate.
    /// </param>
    /// <returns>
    /// The deactivated account and a success message.
    /// </returns>
    [HttpDelete("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(
        string nic)
    {
        // Soft-deactivate the account or finalize an existing Prosumer deactivation request.
        var user =
            await _userService.DeactivateAsync(nic);

        return Ok(
            new
            {
                message =
                    "Account deactivated successfully.",

                user
            });
    }

    /// <summary>
    /// Reactivates a previously deactivated account.
    /// </summary>
    /// <param name="nic">
    /// NIC of the deactivated account.
    /// </param>
    /// <returns>
    /// The reactivated account and a success message.
    /// </returns>
    [HttpPost("{nic}/reactivate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reactivate(
        string nic)
    {
        // Restore a previously deactivated account so that it can access the system again.
        var user =
            await _userService.ReactivateAsync(nic);

        return Ok(
            new
            {
                message =
                    "Account reactivated successfully.",

                user
            });
    }
}