/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AuthController.cs
 * Purpose: Provides login and public Prosumer registration.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(
        IAuthService authService,
        IUserService userService)
    {
        // Store authentication and account services.
        _authService = authService;
        _userService = userService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        // Authenticate credentials and issue a JWT.
        var response =
            await _authService.LoginAsync(request);

        return Ok(response);
    }

    [AllowAnonymous]
    [HttpPost("register-prosumer")]
    public async Task<IActionResult>
        RegisterProsumer(
            [FromBody]
            RegisterProsumerDto request)
    {
        // Create a pending Prosumer account from the mobile registration flow.
        var user =
            await _userService
                .RegisterProsumerAsync(request);

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