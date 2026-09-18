using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class SlotRepository : ISlotRepository
{
    private readonly IMongoCollection<EnergyBookingSlot> _collection;

    public SlotRepository(IMongoDatabase database)
    {
        _collection = database.GetCollection<EnergyBookingSlot>(
            "EnergyBookingSlots");
    }

    public async Task<List<EnergyBookingSlot>> GetAllAsync()
    {
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<EnergyBookingSlot?> GetByIdAsync(string id)
    {
        return await _collection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId)
    {
        return await _collection
            .Find(x => x.StationId == stationId)
            .ToListAsync();
    }

    public async Task CreateAsync(EnergyBookingSlot slot)
    {
        await _collection.InsertOneAsync(slot);
    }

    public async Task UpdateAsync(EnergyBookingSlot slot)
    {
        await _collection.ReplaceOneAsync(
            x => x.Id == slot.Id,
            slot);
    }
}