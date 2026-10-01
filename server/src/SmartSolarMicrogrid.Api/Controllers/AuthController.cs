/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
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
        // Responsible: Shakanyah - IT23214002
        // Store authentication and account services.
        _authService = authService;
        _userService = userService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        // Responsible: Shakanyah - IT23214002
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
        // Responsible: Shakanyah - IT23214002
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
        // Responsible: Shakanyah - IT23214002
        // Register an account and return its initial authentication result.
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
        // Responsible: Shakanyah - IT23214002
        // Return the authenticated user's current profile.
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
        // Responsible: Shakanyah - IT23214002
        // Update editable fields on the authenticated user's profile.
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
        // Responsible: Shakanyah - IT23214002
        // Replace the authenticated user's profile image.
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
        // Responsible: Shakanyah - IT23214002
        // Remove the authenticated user's profile image.
        var profile =
            await _authService.RemoveProfileImageAsync(CurrentNic());

        return Ok(profile);
    }

    private string CurrentNic()
    {
        // Responsible: Shakanyah - IT23214002
        // Read and validate the authenticated user's NIC claim.
        return User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException(
                "Invalid token.");
    }
}
