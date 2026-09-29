/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: AuthService.cs
 * Purpose: Validates account credentials and generates secure,
 *          role-based JWT access tokens.
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
        // Store authentication dependencies.
        _userRepository =
            userRepository;

        _jwtSettings =
            jwtSettings;
    }

    public async Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request)
    {
        // Normalize the NIC before querying MongoDB.
        var nic =
            request.NIC
                .Trim()
                .ToUpperInvariant();

        var user =
            await _userRepository
                .GetByNICAsync(nic);

        // Use one generic credential error to avoid disclosing
        // whether a supplied NIC exists.
        if (user == null)
        {
            throw new UnauthorizedAccessException(
                "Invalid NIC or password.");
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

        // Only fully active accounts may receive new JWTs.
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
        // Create standard identity, role and token-identifier claims.
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

        var now =
            DateTime.UtcNow;

        // Generate the signed access token.
        var token =
            new JwtSecurityToken(
                issuer:
                    _jwtSettings.Issuer,

                audience:
                    _jwtSettings.Audience,

                claims:
                    claims,

                notBefore:
                    now,

                expires:
                    expiresAtUtc,

                signingCredentials:
                    credentials);

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}