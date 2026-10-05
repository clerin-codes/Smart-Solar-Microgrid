/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: IUserRepository.cs
 * Purpose: Defines MongoDB persistence operations required by authentication,
 *          account lifecycle, and Backoffice user-management services.
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

/// <summary>
/// Defines persistence operations for user accounts stored in MongoDB.
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Creates the MongoDB indexes required for unique account data
    /// and commonly used account-management queries.
    /// </summary>
    Task EnsureIndexesAsync();

    /// <summary>
    /// Retrieves a user account using the National Identity Card number.
    /// NIC is the primary identifier of a user account.
    /// </summary>
    /// <param name="nic">National Identity Card number.</param>
    /// <returns>The matching user account, or null when no account exists.</returns>
    Task<UserDetails?> GetByNICAsync(
        string nic);

    /// <summary>
    /// Retrieves user accounts matching optional role and lifecycle-status filters.
    /// When a filter is null, that condition is not applied.
    /// </summary>
    /// <param name="role">Optional user role filter.</param>
    /// <param name="status">Optional account lifecycle-status filter.</param>
    /// <returns>A list of matching user accounts.</returns>
    Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    /// <summary>
    /// Retrieves all user accounts currently in the specified lifecycle state.
    /// Used for workflows such as pending activations and deactivation requests.
    /// </summary>
    /// <param name="status">Required account lifecycle status.</param>
    /// <returns>A list of users in the requested status.</returns>
    Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status);

    /// <summary>
    /// Checks whether a normalized email address is already assigned to
    /// another user account.
    /// </summary>
    /// <param name="email">Normalized email address to check.</param>
    /// <param name="excludeNic">
    /// Optional NIC to exclude when checking uniqueness during an update.
    /// </param>
    /// <returns>True when the email already exists; otherwise false.</returns>
    Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null);

    /// <summary>
    /// Inserts a new user account into the MongoDB collection.
    /// </summary>
    /// <param name="user">User account to create.</param>
    Task CreateAsync(
        UserDetails user);

    /// <summary>
    /// Replaces the persisted user account while retaining NIC
    /// as the immutable account identifier.
    /// </summary>
    /// <param name="user">Updated user account.</param>
    Task UpdateAsync(
        UserDetails user);
}