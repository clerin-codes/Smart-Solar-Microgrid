/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AccountController.cs
 * Purpose: Provides authenticated self-service account operations.
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
public class AccountController : ControllerBase
{
    private readonly IUserService _userService;

    public AccountController(
        IUserService userService)
    {
        // Store account-management service.
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        // Load the profile belonging to the authenticated JWT user.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService.GetByNICAsync(nic);

        return Ok(user);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateUserDto request)
    {
        // Update only the authenticated account's editable details.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    [Authorize(Roles = "Prosumer")]
    [HttpPost("deactivation-request")]
    public async Task<IActionResult>
        RequestDeactivation()
    {
        // Allow a Prosumer to request deactivation of their own account.
        var nic =
            GetCurrentUserNic();

        var user =
            await _userService
                .RequestOwnDeactivationAsync(nic);

        return Ok(new
        {
            message =
                "Account deactivation requested successfully.",

            user
        });
    }

    private string GetCurrentUserNic()
    {
        // Extract the trusted NIC identity claim from the JWT.
        var nic =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(nic))
        {
            throw new UnauthorizedAccessException(
                "Authenticated user NIC is missing.");
        }

        return nic;
    }
}