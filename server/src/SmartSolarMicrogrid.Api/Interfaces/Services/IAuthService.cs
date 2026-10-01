/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: IAuthService.cs
 * Purpose: Defines authentication operations exposed by the service layer.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IAuthService
{
    // Responsible: Shakanyah - IT23214002
    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request);

    // Responsible: Shakanyah - IT23214002
    Task<LoginResponseDto> RegisterAsync(
        RegisterRequestDto request);

    // Responsible: Shakanyah - IT23214002
    Task<ProfileResponseDto> GetProfileAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<ProfileResponseDto> UpdateProfileImageAsync(
        string nic,
        UpdateProfileImageRequestDto request);

    // Responsible: Shakanyah - IT23214002
    Task<ProfileResponseDto> RemoveProfileImageAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<ProfileResponseDto> UpdateProfileAsync(
        string nic,
        UpdateProfileRequestDto request);
}
