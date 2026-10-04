/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: UsersController.cs
 * Purpose: Provides Backoffice-only user and Prosumer administration endpoints.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Backoffice")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        // Store the account-management service used by Backoffice operations.
        _userService = userService;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(
        [FromQuery] UserRole? role = null,
        [FromQuery] AccountStatus? status = null)
    {
        // Return users using optional role and lifecycle-status filters.
        var users =
            await _userService.GetAllAsync(
                role,
                status);

        return Ok(users);
    }

    [HttpGet("pending-activations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingActivations()
    {
        // Return pending Solar Prosumer registrations awaiting Backoffice approval.
        var users =
            await _userService.GetPendingActivationsAsync();

        return Ok(users);
    }

    [HttpGet("deactivation-requests")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeactivationRequests()
    {
        // Return Prosumer deactivation requests awaiting Backoffice finalization.
        var users =
            await _userService.GetDeactivationRequestsAsync();

        return Ok(users);
    }

    [HttpGet("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByNIC(
        string nic)
    {
        // Return one managed account using NIC as the primary identifier.
        var user =
            await _userService.GetByNICAsync(nic);

        return Ok(user);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserDto request)
    {
        // Create a Backoffice or Grid Operator account with an initial password.
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

    [HttpPut("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(
        string nic,
        [FromBody] UpdateUserDto request)
    {
        // Update safe editable profile fields without changing NIC, role or lifecycle state.
        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    [HttpPost("{nic}/activate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Activate(
        string nic)
    {
        // Approve a pending Prosumer registration and enable authentication.
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

    [HttpDelete("{nic}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(
        string nic)
    {
        // Soft-deactivate an active account or finalize a Prosumer deactivation request.
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

    [HttpPost("{nic}/reactivate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reactivate(
        string nic)
    {
        // Restore a previously deactivated account.
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