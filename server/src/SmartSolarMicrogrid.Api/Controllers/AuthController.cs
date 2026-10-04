/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AuthController.cs
 * Purpose: Exposes public authentication and Solar Prosumer registration endpoints.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(
        IAuthService authService,
        IUserService userService)
    {
        // Store services used by authentication and public Prosumer registration.
        _authService = authService;
        _userService = userService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        // Validate credentials and return a role-aware JWT for an active account.
        var response =
            await _authService.LoginAsync(request);

        return Ok(response);
    }

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