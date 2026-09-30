using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.Exceptions;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        JwtSettings jwtSettings)
    {
        _userRepository = userRepository;
        _jwtSettings = jwtSettings;
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request)
    {
        var user =
            await _userRepository.GetByNICAsync(request.NIC);

        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "Invalid NIC or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException(
                "This account is inactive.");
        }

        var passwordValid =
            BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash);

        if (!passwordValid)
        {
            throw new UnauthorizedAccessException(
                "Invalid NIC or password.");
        }

        var token = GenerateToken(
            user.NIC,
            user.FullName,
            user.Role.ToString());

        return new LoginResponseDto
        {
            Token = token,
            NIC = user.NIC,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }

    public async Task<LoginResponseDto> RegisterAsync(
        RegisterRequestDto request)
    {
        var nic = request.NIC?.Trim() ?? string.Empty;
        var fullName = request.FullName?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var phone = request.PhoneNumber?.Trim() ?? string.Empty;
        var password = request.Password ?? string.Empty;

        if (nic.Length == 0)
        {
            throw new ArgumentException("NIC is required.");
        }

        if (fullName.Length == 0)
        {
            throw new ArgumentException("Full name is required.");
        }

        ValidateEmail(email);
        ValidatePhone(phone);

        if (password.Length < MinPasswordLength)
        {
            throw new ArgumentException(
                $"Password must be at least {MinPasswordLength} characters.");
        }

        if (await _userRepository.GetByNICAsync(nic) != null)
        {
            throw new ConflictException(
                "An account with this NIC already exists.");
        }

        if (await _userRepository.GetByEmailAsync(email) != null)
        {
            throw new ConflictException(
                "An account with this email already exists.");
        }

        var user = new UserDetails
        {
            NIC = nic,
            FullName = fullName,
            Email = email,
            PhoneNumber = phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),

            // Self-registration always creates a prosumer.
            Role = UserRole.Prosumer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        try
        {
            await _userRepository.CreateAsync(user);
        }
        catch (MongoWriteException ex)
            when (ex.WriteError.Category == ServerErrorCategory.DuplicateKey)
        {
            // Two registrations for the same NIC raced past the check above.
            throw new ConflictException(
                "An account with this NIC already exists.");
        }

        return new LoginResponseDto
        {
            Token = GenerateToken(
                user.NIC,
                user.FullName,
                user.Role.ToString()),
            NIC = user.NIC,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }

    public async Task<ProfileResponseDto> GetProfileAsync(
        string nic)
    {
        var user = await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        return ToProfile(user);
    }

    public async Task<ProfileResponseDto> UpdateProfileAsync(
        string nic,
        UpdateProfileRequestDto request)
    {
        var user = await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        var fullName = request.FullName?.Trim() ?? string.Empty;
        var email = request.Email?.Trim() ?? string.Empty;
        var phone = request.PhoneNumber?.Trim() ?? string.Empty;

        if (fullName.Length == 0)
        {
            throw new ArgumentException("Full name is required.");
        }

        ValidateEmail(email);
        ValidatePhone(phone);

        var sameEmail = await _userRepository.GetByEmailAsync(email);

        if (sameEmail != null && sameEmail.NIC != user.NIC)
        {
            throw new ConflictException(
                "An account with this email already exists.");
        }

        user.FullName = fullName;
        user.Email = email;
        user.PhoneNumber = phone;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return ToProfile(user);
    }

    // Same rules as the Android registration form.
    private const int MinPasswordLength = 8;

    private static readonly Regex EmailPattern =
        new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");

    private static readonly Regex PhonePattern =
        new(@"^\+?[0-9]{9,12}$");

    private static void ValidateEmail(string email)
    {
        if (!EmailPattern.IsMatch(email))
        {
            throw new ArgumentException(
                "Enter a valid email address.");
        }
    }

    private static void ValidatePhone(string phone)
    {
        if (!PhonePattern.IsMatch(phone))
        {
            throw new ArgumentException(
                "Enter a valid phone number.");
        }
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

    private string GenerateToken(
        string nic,
        string fullName,
        string role)
    {
        var claims = new List<Claim>
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                nic),

            new Claim(
                ClaimTypes.Name,
                fullName),

            new Claim(
                ClaimTypes.Role,
                role)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _jwtSettings.SecretKey));

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

        var expiry =
            DateTime.UtcNow.AddMinutes(
                _jwtSettings.ExpiryMinutes);

        var tokenDescriptor =
            new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: expiry,
                signingCredentials: credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(tokenDescriptor);
    }
}