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

    // Profile pictures are stored as base64 text on the user document. The app sends a small resized JPEG,
    // and the limit here stops anything much bigger being stored.
    private const int MaxProfileImageBytes = 1_048_576;

    public async Task<ProfileResponseDto> UpdateProfileImageAsync(
        string nic,
        UpdateProfileImageRequestDto request)
    {
        var user = await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.ProfileImage = NormaliseProfileImage(request.ImageBase64);
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return ToProfile(user);
    }

    public async Task<ProfileResponseDto> RemoveProfileImageAsync(
        string nic)
    {
        var user = await _userRepository.GetByNICAsync(nic);

        if (user == null)
        {
            throw new KeyNotFoundException("User not found.");
        }

        user.ProfileImage = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        return ToProfile(user);
    }

    /// <summary>Checks the base64 is a real, reasonably small JPEG/PNG/WebP and returns it without any data: prefix.</summary>
    private static string NormaliseProfileImage(string? input)
    {
        var text = input?.Trim() ?? string.Empty;

        var comma = text.IndexOf(',');
        if (text.StartsWith("data:", StringComparison.OrdinalIgnoreCase) && comma >= 0)
        {
            text = text[(comma + 1)..];
        }

        if (text.Length == 0)
        {
            throw new ArgumentException("Choose an image to upload.");
        }

        // Base64 is about 4/3 the size of the bytes, so reject oversize text before decoding it.
        if (text.Length > MaxProfileImageBytes * 4 / 3 + 8)
        {
            throw new ArgumentException("The image is too large. Choose a smaller one.");
        }

        var bytes = new byte[text.Length];

        if (!Convert.TryFromBase64String(text, bytes, out var length))
        {
            throw new ArgumentException("The image data is not valid base64.");
        }

        if (length > MaxProfileImageBytes)
        {
            throw new ArgumentException("The image is too large. Choose a smaller one.");
        }

        var isJpeg = length > 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
        var isPng = length > 8 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        var isWebp = length > 12 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46
            && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;

        if (!isJpeg && !isPng && !isWebp)
        {
            throw new ArgumentException("The image must be a JPEG, PNG or WebP file.");
        }

        return Convert.ToBase64String(bytes, 0, length);
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
            IsActive = user.IsActive,
            ProfileImage = user.ProfileImage
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