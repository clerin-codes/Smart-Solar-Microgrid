/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: IUserService.cs
 * Purpose: Defines account-management business operations.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IUserService
{
    // Responsible: Shakanyah - IT23214002
    Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    // Responsible: Shakanyah - IT23214002
    Task<List<UserResponseDto>>
        GetPendingActivationsAsync();

    // Responsible: Shakanyah - IT23214002
    Task<List<UserResponseDto>>
        GetDeactivationRequestsAsync();

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> GetByNICAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> CreateAsync(
        CreateUserDto request);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> RegisterProsumerAsync(
        RegisterProsumerDto request);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto>
        RequestOwnDeactivationAsync(
            string nic);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> ActivateAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> DeactivateAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<UserResponseDto> ReactivateAsync(
        string nic);
}
