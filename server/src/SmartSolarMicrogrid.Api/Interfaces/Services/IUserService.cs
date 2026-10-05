/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: IUserService.cs
 * Purpose: Defines user account management, Prosumer registration,
 *          profile maintenance, password management, and account
 *          lifecycle operations used by the central API.
 */

using SmartSolarMicrogrid.Api.DTOs.Auth;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

/// <summary>
/// Defines the business operations for user accounts and account lifecycle management.
/// All implementations must enforce the required account rules in the central API.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Returns all users with optional role and account-status filtering.
    /// </summary>
    /// <param name="role">
    /// Optional user role filter.
    /// </param>
    /// <param name="status">
    /// Optional account status filter.
    /// </param>
    /// <returns>
    /// A list of matching user accounts.
    /// </returns>
    Task<List<UserResponseDto>> GetAllAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    /// <summary>
    /// Returns Solar Prosumer registrations waiting for Backoffice activation.
    /// </summary>
    /// <returns>
    /// A list of users whose accounts are in PendingActivation status.
    /// </returns>
    Task<List<UserResponseDto>> GetPendingActivationsAsync();

    /// <summary>
    /// Returns Solar Prosumer accounts that have requested deactivation.
    /// </summary>
    /// <returns>
    /// A list of users whose accounts are in DeactivationRequested status.
    /// </returns>
    Task<List<UserResponseDto>> GetDeactivationRequestsAsync();

    /// <summary>
    /// Returns a single user account identified by NIC.
    /// </summary>
    /// <param name="nic">
    /// National Identity Card number used as the account identifier.
    /// </param>
    /// <returns>
    /// The matching user account.
    /// </returns>
    Task<UserResponseDto> GetByNICAsync(
        string nic);

    /// <summary>
    /// Creates a web application account for a Backoffice or Grid Operator user.
    /// Prosumer self-registration must use RegisterProsumerAsync instead.
    /// </summary>
    /// <param name="request">
    /// Validated account creation data.
    /// </param>
    /// <returns>
    /// The newly created user account.
    /// </returns>
    Task<UserResponseDto> CreateAsync(
        CreateUserDto request);

    /// <summary>
    /// Creates a Solar Prosumer account in PendingActivation status.
    /// The account cannot access the system until activated by Backoffice.
    /// </summary>
    /// <param name="request">
    /// Validated Prosumer registration data.
    /// </param>
    /// <returns>
    /// The newly registered pending Prosumer account.
    /// </returns>
    Task<UserResponseDto> RegisterProsumerAsync(
        RegisterProsumerDto request);

    /// <summary>
    /// Updates safe editable account fields such as full name,
    /// email address, and mobile number.
    /// </summary>
    /// <param name="nic">
    /// NIC of the account being updated.
    /// </param>
    /// <param name="request">
    /// Validated profile update data.
    /// </param>
    /// <returns>
    /// The updated user account.
    /// </returns>
    Task<UserResponseDto> UpdateAsync(
        string nic,
        UpdateUserDto request);

    /// <summary>
    /// Creates a self-deactivation request for an active Solar Prosumer account.
    /// </summary>
    /// <param name="nic">
    /// NIC of the authenticated Prosumer.
    /// </param>
    /// <returns>
    /// The updated account in DeactivationRequested status.
    /// </returns>
    Task<UserResponseDto> RequestOwnDeactivationAsync(
        string nic);

    /// <summary>
    /// Activates a Solar Prosumer account that is currently waiting for activation.
    /// </summary>
    /// <param name="nic">
    /// NIC of the pending Prosumer account.
    /// </param>
    /// <returns>
    /// The activated user account.
    /// </returns>
    Task<UserResponseDto> ActivateAsync(
        string nic);

    /// <summary>
    /// Deactivates an active account or finalizes a Prosumer
    /// deactivation request according to the account lifecycle rules.
    /// </summary>
    /// <param name="nic">
    /// NIC of the account being deactivated.
    /// </param>
    /// <returns>
    /// The deactivated user account.
    /// </returns>
    Task<UserResponseDto> DeactivateAsync(
        string nic);

    /// <summary>
    /// Reactivates a previously deactivated account.
    /// </summary>
    /// <param name="nic">
    /// NIC of the deactivated account.
    /// </param>
    /// <returns>
    /// The reactivated user account.
    /// </returns>
    Task<UserResponseDto> ReactivateAsync(
        string nic);

    /// <summary>
    /// Changes the authenticated user's password after verifying
    /// the existing password and validating the new password.
    /// </summary>
    /// <param name="nic">
    /// NIC of the authenticated account.
    /// </param>
    /// <param name="request">
    /// Current password and new password details.
    /// </param>
    Task ChangePasswordAsync(
        string nic,
        ChangePasswordDto request);
}