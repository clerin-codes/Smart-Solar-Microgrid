/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: IUserRepository.cs
 * Purpose: Defines MongoDB persistence operations for accounts.
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IUserRepository
{
    // Responsible: Shakanyah - IT23214002
    Task EnsureIndexesAsync();

    // Responsible: Shakanyah - IT23214002
    Task<UserDetails?> GetByNICAsync(
        string nic);

    // Responsible: Shakanyah - IT23214002
    Task<UserDetails?> GetByEmailAsync(string email);

    // Responsible: Shakanyah - IT23214002
    Task<List<UserDetails>> GetAllAsync();

    // Responsible: Shakanyah - IT23214002
    Task<List<UserDetails>> GetFilteredAsync(
        UserRole? role = null,
        AccountStatus? status = null);

    // Responsible: Shakanyah - IT23214002
    Task<List<UserDetails>> GetByStatusAsync(
        AccountStatus status);

    // Responsible: Shakanyah - IT23214002
    Task<bool> EmailExistsAsync(
        string email,
        string? excludeNic = null);

    // Responsible: Shakanyah - IT23214002
    Task CreateAsync(
        UserDetails user);

    // Responsible: Shakanyah - IT23214002
    Task UpdateAsync(
        UserDetails user);
}
