using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IUserRepository
{
    Task<UserDetails?> GetByNICAsync(string nic);

    Task<List<UserDetails>> GetAllAsync();

    Task CreateAsync(UserDetails user);

    Task UpdateAsync(UserDetails user);
}