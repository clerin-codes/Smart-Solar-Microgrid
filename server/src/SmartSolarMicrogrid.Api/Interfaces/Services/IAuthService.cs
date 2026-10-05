/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * Author: Sahanya - IT23214002
 *
 * File: IAuthService.cs
 *
 * Purpose:
 * Defines authentication operations provided by the central API.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IAuthService
{
    /// <summary>
    /// Validates account credentials and returns a signed JWT
    /// for an active authenticated user.
    /// </summary>
    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request);
}