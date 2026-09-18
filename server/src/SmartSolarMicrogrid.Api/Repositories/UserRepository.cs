using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<UserDetails> _collection;

    public UserRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<UserDetails>(
            "UserDetails");
    }

    public async Task<UserDetails?> GetByNICAsync(string nic)
    {
        return await _collection
            .Find(x => x.NIC == nic)
            .FirstOrDefaultAsync();
    }

    public async Task<List<UserDetails>> GetAllAsync()
    {
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task CreateAsync(UserDetails user)
    {
        await _collection.InsertOneAsync(user);
    }

    public async Task UpdateAsync(UserDetails user)
    {
        await _collection.ReplaceOneAsync(
            x => x.NIC == user.NIC,
            user);
    }
}