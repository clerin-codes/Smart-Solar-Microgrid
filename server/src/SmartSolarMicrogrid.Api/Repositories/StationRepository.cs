/*
 * File: StationRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Persists and queries solar stations in MongoDB.
 * Author: Sithmi - IT23241114
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class StationRepository : IStationRepository
{
    private readonly IMongoCollection<SolarStationInfo> _collection;

    public StationRepository(IMongoDatabase database)
    {
        // Responsible: Sithmi - IT23241114
        // Resolve the MongoDB solar-station collection.
        _collection = database.GetCollection<SolarStationInfo>(
            "SolarStationInfo");
    }

    public async Task<List<SolarStationInfo>> GetAllAsync()
    {
        // Responsible: Sithmi - IT23241114
        // Return every solar station stored in MongoDB.
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<SolarStationInfo?> GetByIdAsync(string id)
    {
        // Responsible: Sithmi - IT23241114
        // Find a solar station by its MongoDB identifier.
        return await _collection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<SolarStationInfo?> GetByCodeAsync(string stationCode)
    {
        // Responsible: Sithmi - IT23241114
        // Find a solar station by its unique station code.
        return await _collection
            .Find(x => x.StationCode == stationCode)
            .FirstOrDefaultAsync();
    }

    public async Task CreateAsync(SolarStationInfo station)
    {
        // Responsible: Sithmi - IT23241114
        // Insert a new solar-station document.
        await _collection.InsertOneAsync(station);
    }

    public async Task UpdateAsync(SolarStationInfo station)
    {
        // Responsible: Sithmi - IT23241114
        // Replace the stored solar-station document with its updated state.
        await _collection.ReplaceOneAsync(
            x => x.Id == station.Id,
            station);
    }
}
