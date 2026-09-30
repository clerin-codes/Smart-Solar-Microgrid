/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AuthController.cs
 * Purpose: Provides login, public registration, and own-profile
 *          and profile-picture management.
 */

using System.Security.Claims;
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

    // POST: /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto request)
    {
        var response =
            await _authService.RegisterAsync(request);

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    // GET: /api/auth/profile
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var profile =
            await _authService.GetProfileAsync(CurrentNic());

        return Ok(profile);
    }

    // PUT: /api/auth/profile
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequestDto request)
    {
        var profile =
            await _authService.UpdateProfileAsync(
                CurrentNic(),
                request);

        return Ok(profile);
    }

    // PUT: /api/auth/profile/image
    // Body: { "imageBase64": "<base64 of a JPEG, PNG or WebP>" }
    [HttpPut("profile/image")]
    [Authorize]
    public async Task<IActionResult> UpdateProfileImage(
        [FromBody] UpdateProfileImageRequestDto request)
    {
        var profile =
            await _authService.UpdateProfileImageAsync(
                CurrentNic(),
                request);

        return Ok(profile);
    }

    // DELETE: /api/auth/profile/image
    [HttpDelete("profile/image")]
    [Authorize]
    public async Task<IActionResult> RemoveProfileImage()
    {
        var profile =
            await _authService.RemoveProfileImageAsync(CurrentNic());

        return Ok(profile);
    }

    private string CurrentNic()
    {
        return User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException(
                "Invalid token.");
    }
}