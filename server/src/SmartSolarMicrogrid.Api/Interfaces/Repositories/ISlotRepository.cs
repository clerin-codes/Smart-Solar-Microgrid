using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface ISlotRepository
{
    Task<List<EnergyBookingSlot>> GetAllAsync();

    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId);

    Task CreateAsync(EnergyBookingSlot slot);

    Task UpdateAsync(EnergyBookingSlot slot);
}