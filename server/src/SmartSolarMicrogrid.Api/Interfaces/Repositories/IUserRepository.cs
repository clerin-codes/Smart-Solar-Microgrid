using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IUserRepository
{
    Task<UserDetails?> GetByNICAsync(string nic);

    Task<UserDetails?> GetByEmailAsync(string email);

    Task<List<UserDetails>> GetAllAsync();

    Task CreateAsync(UserDetails user);

    Task UpdateAsync(UserDetails user);
}