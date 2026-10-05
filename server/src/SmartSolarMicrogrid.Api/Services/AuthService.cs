/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * Author: Sahanya - IT23214002
 *
 * File: AuthService.cs
 *
 * Purpose:
 * Validates login credentials and generates signed JWT access tokens
 * containing the authenticated user's identity and authorization role.
 *
 * Security:
 * - Passwords are verified using BCrypt.
 * - Login errors do not reveal whether a NIC exists.
 * - Only Active accounts can receive access tokens.
 * - JWTs contain the immutable NIC and application role.
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
        // Store authentication dependencies required for
        // account lookup, password verification and JWT generation.
        _userRepository =
            userRepository;

        _jwtSettings =
            jwtSettings;
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request)
    {
        // Normalize the immutable NIC identifier before
        // querying the MongoDB user collection.
        var nic =
            (request.NIC ?? string.Empty)
                .Trim()
                .ToUpperInvariant();

        var user =
            await _userRepository
                .GetByNICAsync(nic);

        // Use one generic credential error for both an
        // unknown NIC and an invalid password to prevent
        // account-enumeration attacks.
        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash))
        {
            throw new UnauthorizedAccessException(
                "Invalid NIC or password.");
        }

        // Only fully active accounts may authenticate.
        // Pending, deactivation-requested and deactivated
        // accounts must complete their lifecycle action first.
        if (!user.IsActive ||
            user.Status != AccountStatus.Active)
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

        // Calculate one expiry timestamp and use the same
        // value in both the JWT and the login response.
        var expiresAtUtc =
            DateTime.UtcNow.AddMinutes(
                _jwtSettings.ExpiryMinutes);

        var token =
            GenerateToken(
                user,
                expiresAtUtc);

        // Return only the authentication information needed
        // by the Web and Android clients.
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
        // Build the claims used by ASP.NET Core authentication
        // and role-based authorization.
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

        // Create the symmetric signing key from the
        // validated JWT configuration.
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

        // Create a signed JWT with the configured issuer,
        // audience and expiry time.
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

        // Serialize the JWT into the Bearer-token string
        // returned to the authenticated client.
        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}