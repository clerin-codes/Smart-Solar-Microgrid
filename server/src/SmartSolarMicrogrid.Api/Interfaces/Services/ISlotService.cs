using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface ISlotService
{
    Task<List<EnergyBookingSlot>> GetAllAsync();

    Task<EnergyBookingSlot?> GetByIdAsync(
        string id);

    Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId);

    Task<EnergyBookingSlot> CreateAsync(
        CreateSlotDto request);

    Task<EnergyBookingSlot> UpdateAsync(
        string id,
        UpdateSlotDto request);
}