using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class StationRepository : IStationRepository
{
    private readonly IMongoCollection<SolarStationInfo> _collection;

    public StationRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<SolarStationInfo>(
            "SolarStationInfo");
    }

    public async Task<List<SolarStationInfo>> GetAllAsync()
    {
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<SolarStationInfo?> GetByIdAsync(string id)
    {
        return await _collection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(SolarStationInfo station)
    {
        await _collection.InsertOneAsync(station);
    }

    public async Task UpdateAsync(SolarStationInfo station)
    {
        await _collection.ReplaceOneAsync(
            x => x.Id == station.Id,
            station);
    }
}