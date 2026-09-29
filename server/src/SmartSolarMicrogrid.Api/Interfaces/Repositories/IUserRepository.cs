/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: IUserRepository.cs
 * Purpose: Defines MongoDB persistence operations for accounts.
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IUserRepository
{
    Task EnsureIndexesAsync();

    Task<UserDetails?> GetByNICAsync(
        string nic);

    Task<List<UserDetails>> GetAllAsync();

    Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status);

    Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null);

    Task CreateAsync(
        UserDetails user);

    Task UpdateAsync(
        UserDetails user);
}