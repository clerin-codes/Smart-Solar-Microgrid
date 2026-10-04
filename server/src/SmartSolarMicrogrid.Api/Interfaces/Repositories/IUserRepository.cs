/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IUserRepository.cs
 * Purpose: Defines MongoDB persistence operations required by account services.
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IUserRepository
{
    /// <summary>
    /// Creates indexes used for uniqueness and common account queries.
    /// </summary>
    Task EnsureIndexesAsync();

    /// <summary>
    /// Finds one account by NIC.
    /// </summary>
    Task<UserDetails?> GetByNICAsync(
        string nic);

    /// <summary>
    /// Returns users matching optional role and lifecycle-status filters.
    /// </summary>
    Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    /// <summary>
    /// Returns users in a specific lifecycle state.
    /// </summary>
    Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status);

    /// <summary>
    /// Checks whether a normalized email belongs to another account.
    /// </summary>
    Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null);

    /// <summary>
    /// Inserts a new account document.
    /// </summary>
    Task CreateAsync(
        UserDetails user);

    /// <summary>
    /// Replaces an existing account document using immutable NIC identity.
    /// </summary>
    Task UpdateAsync(
        UserDetails user);
}