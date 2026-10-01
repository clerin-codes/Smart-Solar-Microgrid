/*
 * File: SlotRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Persists and queries energy booking slots in MongoDB.
 * Author: Sithmi - IT23241114
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Repositories;

public class SlotRepository : ISlotRepository
{
    private readonly IMongoCollection<EnergyBookingSlot> _collection;

    public SlotRepository(IMongoDatabase database)
    {
        // Responsible: Sithmi - IT23241114
        // Resolve the MongoDB booking-slot collection.
        _collection = database.GetCollection<EnergyBookingSlot>(
            "EnergyBookingSlots");
    }

    public async Task<List<EnergyBookingSlot>> GetAllAsync()
    {
        // Responsible: Sithmi - IT23241114
        // Return every energy booking slot stored in MongoDB.
        return await _collection
            .Find(_ => true)
            .ToListAsync();
    }

    public async Task<EnergyBookingSlot?> GetByIdAsync(string id)
    {
        // Responsible: Sithmi - IT23241114
        // Find a booking slot by its MongoDB identifier.
        return await _collection
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId)
    {
        // Responsible: Sithmi - IT23241114
        // Return all booking slots belonging to the supplied station.
        return await _collection
            .Find(x => x.StationId == stationId)
            .ToListAsync();
    }

    public async Task CreateAsync(EnergyBookingSlot slot)
    {
        // Responsible: Sithmi - IT23241114
        // Insert a new booking-slot document.
        await _collection.InsertOneAsync(slot);
    }

    public async Task UpdateAsync(EnergyBookingSlot slot)
    {
        // Responsible: Sithmi - IT23241114
        // Replace the stored booking-slot document with its updated state.
        await _collection.ReplaceOneAsync(
            x => x.Id == slot.Id,
            slot);
    }
}
