using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IUserService
{
    Task<List<UserDetails>> GetAllAsync();

    Task<UserDetails?> GetByNICAsync(string nic);

    Task<UserDetails> CreateAsync(
        CreateUserDto request);

    Task<UserDetails> UpdateAsync(
        string nic,
        UpdateUserDto request);

    Task DeactivateAsync(string nic);

    Task ReactivateAsync(string nic);
}