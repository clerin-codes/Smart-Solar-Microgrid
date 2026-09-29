/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IUserService.cs
 * Purpose: Defines account-management business operations.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IUserService
{
    Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    Task<List<UserResponseDto>>
        GetPendingActivationsAsync();

    Task<List<UserResponseDto>>
        GetDeactivationRequestsAsync();

    Task<UserResponseDto> GetByNICAsync(
        string nic);

    Task<UserResponseDto> CreateAsync(
        CreateUserDto request);

    Task<UserResponseDto> RegisterProsumerAsync(
        RegisterProsumerDto request);

    Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request);

    Task<UserResponseDto>
        RequestOwnDeactivationAsync(
            string nic);

    Task<UserResponseDto> ActivateAsync(
        string nic);

    Task<UserResponseDto> DeactivateAsync(
        string nic);

    Task<UserResponseDto> ReactivateAsync(
        string nic);
}