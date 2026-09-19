using System.Net.Mail;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

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
        _authService = authService;
        _userService = userService;
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
    // Public self-registration. Always creates a Prosumer account;
    // Grid Operator and Backoffice accounts are created by Backoffice users.
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto request)
    {
        ValidateRegistration(request);

        await _userService.CreateAsync(
            new CreateUserDto
            {
                NIC = request.NIC.Trim(),
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                PhoneNumber = request.PhoneNumber.Trim(),
                Password = request.Password,
                Role = UserRole.Prosumer
            });

        var response =
            await _authService.LoginAsync(
                new LoginRequestDto
                {
                    NIC = request.NIC.Trim(),
                    Password = request.Password
                });

        return StatusCode(
            StatusCodes.Status201Created,
            response);
    }

    // GET: /api/auth/profile
    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var user = await GetCurrentUserAsync();

        return Ok(ToProfile(user));
    }

    // PUT: /api/auth/profile
    // Users can update their own name, email and phone number.
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateUserDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        ValidateEmail(request.Email);
        ValidatePhone(request.PhoneNumber);

        var nic = GetCurrentNic();

        var updated =
            await _userService.UpdateAsync(nic, request);

        return Ok(ToProfile(updated));
    }

    private async Task<UserDetails> GetCurrentUserAsync()
    {
        var user =
            await _userService.GetByNICAsync(GetCurrentNic());

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return user;
    }

    private string GetCurrentNic()
    {
        var nic =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(nic))
        {
            throw new UnauthorizedAccessException(
                "User NIC could not be found in the authentication token.");
        }

        return nic;
    }

    private static ProfileResponseDto ToProfile(UserDetails user)
    {
        return new ProfileResponseDto
        {
            NIC = user.NIC,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.ToString(),
            IsActive = user.IsActive
        };
    }

    private static void ValidateRegistration(
        RegisterRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.NIC))
        {
            throw new ArgumentException("NIC is required.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        ValidateEmail(request.Email);
        ValidatePhone(request.PhoneNumber);

        if (string.IsNullOrEmpty(request.Password) ||
            request.Password.Length < 8)
        {
            throw new ArgumentException(
                "Password must be at least 8 characters.");
        }
    }

    private static void ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email) ||
            !MailAddress.TryCreate(email, out _))
        {
            throw new ArgumentException(
                "A valid email address is required.");
        }
    }

    private static void ValidatePhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone) ||
            phone.Trim().Length < 9)
        {
            throw new ArgumentException(
                "A valid phone number is required.");
        }
    }
}
