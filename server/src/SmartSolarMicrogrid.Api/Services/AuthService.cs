/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AuthService.cs
 * Purpose: Validates account credentials and generates role-based JWT access tokens.
 */

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Microsoft.IdentityModel.Tokens;

using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.DTOs.Auth;
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
        // Store dependencies used for credential verification and token creation.
        _userRepository =
            userRepository;

        _jwtSettings =
            jwtSettings;
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request)
    {
        // Normalize the NIC before querying the immutable MongoDB account identifier.
        var nic =
            request.NIC
                .Trim()
                .ToUpperInvariant();

        var user =
            await _userRepository
                .GetByNICAsync(nic);

        // Return one generic credential error so an attacker cannot enumerate registered NICs.
        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash))
        {
            throw new UnauthorizedAccessException(
                "Invalid NIC or password.");
        }

        // Only fully active accounts are allowed to receive new access tokens.
        if (!user.IsActive ||
            user.Status !=
            AccountStatus.Active)
        {
            var message =
                user.Status switch
                {
                    AccountStatus.PendingActivation =>
                        "Your account is awaiting Backoffice activation.",

                    AccountStatus.DeactivationRequested =>
                        "Your account has a pending deactivation request.",

                    AccountStatus.Deactivated =>
                        "Your account is deactivated.",

                    _ =>
                        "This account is inactive."
                };

            throw new UnauthorizedAccessException(
                message);
        }

        // Create a short-lived signed JWT carrying the immutable NIC and authorization role.
        var expiresAtUtc =
            DateTime.UtcNow.AddMinutes(
                _jwtSettings.ExpiryMinutes);

        var token =
            GenerateToken(
                user,
                expiresAtUtc);

        return new LoginResponseDto
        {
            Token =
                token,

            TokenType =
                "Bearer",

            ExpiresAtUtc =
                expiresAtUtc,

            NIC =
                user.NIC,

            FullName =
                user.FullName,

            Role =
                user.Role,

            AccountStatus =
                user.Status
        };
    }

    private string GenerateToken(
        UserDetails user,
        DateTime expiresAtUtc)
    {
        // Build identity and role claims consumed by ASP.NET Core authorization.
        var claims =
            new List<Claim>
            {
                new(
                    JwtRegisteredClaimNames.Sub,
                    user.NIC),

                new(
                    ClaimTypes.NameIdentifier,
                    user.NIC),

                new(
                    ClaimTypes.Name,
                    user.FullName),

                new(
                    ClaimTypes.Role,
                    user.Role.ToString()),

                new(
                    JwtRegisteredClaimNames.Jti,
                    Guid.NewGuid().ToString())
            };

        var signingKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _jwtSettings.SecretKey))
            {
                KeyId =
                    JwtSettings.SigningKeyId
            };

        var credentials =
            new SigningCredentials(
                signingKey,
                SecurityAlgorithms.HmacSha256);

        // Generate a signed access token using configured issuer, audience and expiry.
        var token =
            new JwtSecurityToken(
                issuer:
                    _jwtSettings.Issuer,

                audience:
                    _jwtSettings.Audience,

                claims:
                    claims,

                notBefore:
                    DateTime.UtcNow,

                expires:
                    expiresAtUtc,

                signingCredentials:
                    credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}