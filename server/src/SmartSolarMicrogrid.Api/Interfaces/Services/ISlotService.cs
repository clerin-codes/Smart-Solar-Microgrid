using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Models;
using System;
using System.Collections.Generic;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface ISlotService
{
    Task<List<EnergyBookingSlot>> GetAllAsync();

    Task<EnergyBookingSlot?> GetByIdAsync(string id);

    Task<List<EnergyBookingSlot>> GetByStationAsync(string stationId);

    Task<EnergyBookingSlot> CreateAsync(CreateSlotDto request);

    Task<EnergyBookingSlot> UpdateAsync(string id, UpdateSlotDto request);

    // New method to retrieve available slots with optional filters
    Task<List<EnergyBookingSlot>> GetAvailableSlotsAsync(string? stationId = null, DateTime? date = null);
}