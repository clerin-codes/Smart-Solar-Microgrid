/*
 * File: ISlotRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Declares persistence operations for energy booking slots.
 * Author: Sithmi - IT23241114
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface ISlotRepository
{
    // Responsible: Sithmi - IT23241114
    Task<List<EnergyBookingSlot>> GetAllAsync();

    // Responsible: Sithmi - IT23241114
    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    // Responsible: Sithmi - IT23241114
    Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId);

    // Responsible: Sithmi - IT23241114
    Task CreateAsync(EnergyBookingSlot slot);

    // Responsible: Sithmi - IT23241114
    Task UpdateAsync(EnergyBookingSlot slot);
}
