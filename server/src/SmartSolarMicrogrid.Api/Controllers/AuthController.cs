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

    public AuthController(
        IAuthService authService)
    {
        _authService = authService;
    }

    // POST: /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request)
    {
        var response =
            await _authService.LoginAsync(request);

        return Ok(response);
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