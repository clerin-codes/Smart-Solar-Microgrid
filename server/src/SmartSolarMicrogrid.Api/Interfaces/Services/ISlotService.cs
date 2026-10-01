/*
 * File: ISlotService.cs
 * Project: Smart Solar Microgrid
 * Description: Declares energy booking slot business operations.
 * Author: Sithmi - IT23241114
 */

using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Models;
using System;
using System.Collections.Generic;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface ISlotService
{
    // Responsible: Sithmi - IT23241114
    Task<List<EnergyBookingSlot>> GetAllAsync();

    // Responsible: Sithmi - IT23241114
    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    // Responsible: Sithmi - IT23241114
    Task<List<EnergyBookingSlot>> GetByStationAsync(string stationId);

    // Responsible: Sithmi - IT23241114
    Task<EnergyBookingSlot> CreateAsync(CreateSlotDto request);

    // Responsible: Sithmi - IT23241114
    Task<EnergyBookingSlot> UpdateAsync(string id, UpdateSlotDto request);

    // New method to retrieve available slots with optional filters
    // Responsible: Sithmi - IT23241114
    Task<List<EnergyBookingSlot>> GetAvailableSlotsAsync(string? stationId = null, DateTime? date = null);
}
