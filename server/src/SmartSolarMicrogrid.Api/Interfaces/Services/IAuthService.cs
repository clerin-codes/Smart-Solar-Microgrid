/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IAuthService.cs
 * Purpose: Defines authentication operations that issue JWT access tokens.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IAuthService
{
    /// <summary>
    /// Authenticates an active account and returns its JWT login response.
    /// </summary>
    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request);
}