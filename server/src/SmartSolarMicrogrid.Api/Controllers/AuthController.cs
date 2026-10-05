/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: AuthController.cs
 * Purpose: Exposes public authentication and Solar Prosumer registration endpoints.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

/// <summary>
/// Handles public authentication operations.
/// Login is available to supported system users, while public registration
/// is limited to Solar Prosumers.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    /// <summary>
    /// Initializes the authentication controller with the services required
    /// for credential validation and Solar Prosumer registration.
    /// </summary>
    /// <param name="authService">
    /// Service responsible for authentication and JWT generation.
    /// </param>
    /// <param name="userService">
    /// Service responsible for Solar Prosumer account registration.
    /// </param>
    public AuthController(
        IAuthService authService,
        IUserService userService)
    {
        // Store the services used by the public authentication endpoints.
        _authService = authService;
        _userService = userService;
    }

    /// <summary>
    /// Authenticates a system user and returns a JWT when the supplied
    /// credentials belong to an active account.
    /// </summary>
    /// <param name="request">
    /// Login credentials submitted by the client.
    /// </param>
    /// <returns>
    /// Authentication information including the generated JWT and user details.
    /// </returns>
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        // Validate the credentials and issue a role-aware JWT for an active account.
        var response =
            await _authService.LoginAsync(request);

        return Ok(response);
    }

    /// <summary>
    /// Registers a Solar Prosumer account using the mobile registration flow.
    /// Newly registered Prosumers remain pending until a Backoffice officer
    /// activates the account.
    /// </summary>
    /// <param name="request">
    /// Solar Prosumer registration information.
    /// </param>
    /// <returns>
    /// The newly created pending Prosumer account together with a confirmation message.
    /// </returns>
    [AllowAnonymous]
    [HttpPost("register-prosumer")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RegisterProsumer(
        [FromBody] RegisterProsumerDto request)
    {
        // Create a pending Prosumer account that requires Backoffice activation.
        var user =
            await _userService.RegisterProsumerAsync(request);

        return StatusCode(
            StatusCodes.Status201Created,
            new
            {
                message =
                    "Registration successful. Your account is pending Backoffice activation.",
                user
            });
    }
}