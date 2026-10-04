/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IUserService.cs
 * Purpose: Defines account-management and lifecycle business operations.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IUserService
{
    /// <summary>
    /// Returns users with optional role and status filtering.
    /// </summary>
    Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    /// <summary>
    /// Returns pending Prosumer registrations.
    /// </summary>
    Task<List<UserResponseDto>> GetPendingActivationsAsync();

    /// <summary>
    /// Returns Prosumer deactivation requests.
    /// </summary>
    Task<List<UserResponseDto>> GetDeactivationRequestsAsync();

    /// <summary>
    /// Returns one account identified by NIC.
    /// </summary>
    Task<UserResponseDto> GetByNICAsync(
        string nic);

    /// <summary>
    /// Creates a Backoffice or Grid Operator account.
    /// </summary>
    Task<UserResponseDto> CreateAsync(
        CreateUserDto request);

    /// <summary>
    /// Creates a pending Solar Prosumer registration.
    /// </summary>
    Task<UserResponseDto> RegisterProsumerAsync(
        RegisterProsumerDto request);

    /// <summary>
    /// Updates safe editable account-profile fields.
    /// </summary>
    Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request);

    /// <summary>
    /// Creates a self-deactivation request for an active Prosumer.
    /// </summary>
    Task<UserResponseDto> RequestOwnDeactivationAsync(
        string nic);

    /// <summary>
    /// Activates a pending Prosumer account.
    /// </summary>
    Task<UserResponseDto> ActivateAsync(
        string nic);

    /// <summary>
    /// Soft-deactivates an account or finalizes a deactivation request.
    /// </summary>
    Task<UserResponseDto> DeactivateAsync(
        string nic);

    /// <summary>
    /// Reactivates a previously deactivated account.
    /// </summary>
    Task<UserResponseDto> ReactivateAsync(
        string nic);

    /// <summary>
    /// Changes the authenticated account password after verifying the current password.
    /// </summary>
    Task ChangePasswordAsync(
        string nic,
        ChangePasswordDto request);
}