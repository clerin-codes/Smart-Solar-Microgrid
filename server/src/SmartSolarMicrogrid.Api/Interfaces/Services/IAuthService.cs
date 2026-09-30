/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IAuthService.cs
 * Purpose: Defines authentication operations exposed by the service layer.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(
        LoginRequestDto request);

    Task<LoginResponseDto> RegisterAsync(
        RegisterRequestDto request);

    Task<ProfileResponseDto> GetProfileAsync(
        string nic);

    Task<ProfileResponseDto> UpdateProfileImageAsync(
        string nic,
        UpdateProfileImageRequestDto request);

    Task<ProfileResponseDto> RemoveProfileImageAsync(
        string nic);

    Task<ProfileResponseDto> UpdateProfileAsync(
        string nic,
        UpdateProfileRequestDto request);
}