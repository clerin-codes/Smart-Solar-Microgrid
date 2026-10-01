/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: UsersController.cs
 * Purpose: Provides Backoffice user and Prosumer administration APIs.
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
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(
        IUserService userService)
    {
        // Responsible: Shakanyah - IT23214002
        // Store account-management service.
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] UserRole? role = null,
        [FromQuery] AccountStatus? status = null)
    {
        // Responsible: Shakanyah - IT23214002
        // Retrieve users with optional role/status filtering.
        var users =
            await _userService.GetAllAsync(
                role,
                status);

        return Ok(users);
    }

    [HttpGet("pending-activations")]
    public async Task<IActionResult>
        GetPendingActivations()
    {
        // Responsible: Shakanyah - IT23214002
        // Retrieve Prosumer registrations awaiting approval.
        var users =
            await _userService
                .GetPendingActivationsAsync();

        return Ok(users);
    }

    [HttpGet("deactivation-requests")]
    public async Task<IActionResult>
        GetDeactivationRequests()
    {
        // Responsible: Shakanyah - IT23214002
        // Retrieve Prosumer account-deactivation requests.
        var users =
            await _userService
                .GetDeactivationRequestsAsync();

        return Ok(users);
    }

    [HttpGet("{nic}")]
    public async Task<IActionResult> GetByNIC(
        string nic)
    {
        // Responsible: Shakanyah - IT23214002
        // Retrieve one account by NIC.
        var user =
            await _userService.GetByNICAsync(nic);

        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserDto request)
    {
        // Responsible: Shakanyah - IT23214002
        // Create an account through Backoffice.
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
    public async Task<IActionResult> Update(
        string nic,
        [FromBody] UpdateUserDto request)
    {
        // Responsible: Shakanyah - IT23214002
        // Update a managed account.
        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    [HttpPost("{nic}/activate")]
    public async Task<IActionResult> Activate(
        string nic)
    {
        // Responsible: Shakanyah - IT23214002
        // Approve a pending Prosumer account.
        var user =
            await _userService.ActivateAsync(nic);

        return Ok(new
        {
            message =
                "Account activated successfully.",

            user
        });
    }

    [HttpDelete("{nic}")]
    public async Task<IActionResult> Deactivate(
        string nic)
    {
        // Responsible: Shakanyah - IT23214002
        // Deactivate an account through Backoffice.
        var user =
            await _userService.DeactivateAsync(nic);

        return Ok(new
        {
            message =
                "Account deactivated successfully.",

            user
        });
    }

    [HttpPost("{nic}/reactivate")]
    public async Task<IActionResult> Reactivate(
        string nic)
    {
        // Responsible: Shakanyah - IT23214002
        // Reactivate an inactive account through Backoffice.
        var user =
            await _userService.ReactivateAsync(nic);

        return Ok(new
        {
            message =
                "Account reactivated successfully.",

            user
        });
    }
}
