/*
 * File: SlotService.cs
 * Project: Smart Solar Microgrid
 * Description: Implements energy booking slot business operations.
 * Author: Sithmi - IT23241114
 */

using System;
using System.Collections.Generic;
using System.Linq;
using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class SlotService : ISlotService
{
    private static readonly TimeZoneInfo SriLankaTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows()
                ? "Sri Lanka Standard Time"
                : "Asia/Colombo");

    private readonly ISlotRepository _slotRepository;
    private readonly IStationRepository _stationRepository;

    public SlotService(
        ISlotRepository slotRepository,
        IStationRepository stationRepository)
    {
        // Responsible: Sithmi - IT23241114
        // Store repositories used for slot and station validation.
        _slotRepository = slotRepository;
        _stationRepository = stationRepository;
    }

    public async Task<List<EnergyBookingSlot>> GetAllAsync()
    {
        // Responsible: Sithmi - IT23241114
        // Return every configured energy booking slot.
        return await _slotRepository.GetAllAsync();
    }

    private static DateTime GetSriLankaToday()
    {
        // Responsible: Sithmi - IT23241114
        // Use the application's local business date for slot validation.
        return TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow,
            SriLankaTimeZone).Date;
    }

    private static void ValidateStationSchedule(
        SolarStationInfo station,
        DateTime slotDate,
        TimeSpan startTime,
        TimeSpan endTime)
    {
        // Responsible: Sithmi - IT23241114
        // Slots may only be created during an enabled weekly schedule.
        var dayName = slotDate.DayOfWeek.ToString();
        var schedule = station.Schedules.FirstOrDefault(s =>
            string.Equals(
                s.Day,
                dayName,
                StringComparison.OrdinalIgnoreCase));

        if (schedule == null || !schedule.IsAvailable)
        {
            throw new InvalidOperationException(
                $"The station is unavailable on {dayName}.");
        }

        if (startTime < schedule.OpeningTime ||
            endTime > schedule.ClosingTime)
        {
            throw new InvalidOperationException(
                $"Slot time must be within the station's {dayName} " +
                $"schedule ({schedule.OpeningTime:hh\\:mm} - " +
                $"{schedule.ClosingTime:hh\\:mm}).");
        }
    }

    public async Task<EnergyBookingSlot?> GetByIdAsync(
        string id)
    {
        // Responsible: Sithmi - IT23241114
        // Return a booking slot by its identifier.
        return await _slotRepository.GetByIdAsync(id);
    }

    public async Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId)
    {
        // Responsible: Sithmi - IT23241114
        // Return all booking slots belonging to the selected station.
        return await _slotRepository
            .GetByStationAsync(stationId);
    }

    public async Task<EnergyBookingSlot> CreateAsync(
        CreateSlotDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Validate the station and request before creating a booking slot.
        // Check station exists
        var station =
            await _stationRepository.GetByIdAsync(
                request.StationId);

        if (station == null)
        {
            throw new KeyNotFoundException(
                "Station not found.");
        }

        // Cannot create slots for inactive stations
        if (!station.IsActive)
        {
            throw new InvalidOperationException(
                "Cannot create a slot for an inactive station.");
        }

        // Slot date cannot be in the past
        if (request.SlotDate.Date <
            GetSriLankaToday())
        {
            throw new InvalidOperationException(
                "Slot date cannot be in the past.");
        }

        // End time must be after start time
        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException(
                "End time must be later than start time.");
        }

        ValidateStationSchedule(
            station,
            request.SlotDate.Date,
            request.StartTime,
            request.EndTime);

        // Capacity must be greater than zero
        if (request.CapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Slot capacity must be greater than zero.");
        }

        // Slot capacity cannot exceed station capacity
        if (request.CapacityKw >
            station.CapacityKw)
        {
            throw new InvalidOperationException(
                "Slot capacity cannot exceed station capacity.");
        }

        var slot = new EnergyBookingSlot
        {
            StationId =
                request.StationId,

            SlotDate =
                request.SlotDate.Date,

            StartTime =
                request.StartTime,

            EndTime =
                request.EndTime,

            CapacityKw =
                request.CapacityKw,

            AvailableCapacityKw =
                request.CapacityKw,

            Status =
                SlotStatus.Available,

            CreatedAt =
                DateTime.UtcNow,

            UpdatedAt =
                DateTime.UtcNow
        };

        await _slotRepository.CreateAsync(slot);

        return slot;
    }

    public async Task<EnergyBookingSlot> UpdateAsync(
        string id,
        UpdateSlotDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Validate and update an existing energy booking slot.
        // Check slot exists
        var slot =
            await _slotRepository.GetByIdAsync(id);

        if (slot == null)
        {
            throw new KeyNotFoundException(
                "Slot not found.");
        }

        // Get the station belonging to this slot
        var station =
            await _stationRepository.GetByIdAsync(
                slot.StationId);

        if (station == null)
        {
            throw new KeyNotFoundException(
                "Station not found.");
        }

        // Slot date cannot be in the past
        if (request.SlotDate.Date <
            GetSriLankaToday())
        {
            throw new InvalidOperationException(
                "Slot date cannot be in the past.");
        }

        // End time must be after start time
        if (request.EndTime <= request.StartTime)
        {
            throw new InvalidOperationException(
                "End time must be later than start time.");
        }

        ValidateStationSchedule(
            station,
            request.SlotDate.Date,
            request.StartTime,
            request.EndTime);

        // Capacity must be greater than zero
        if (request.CapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Slot capacity must be greater than zero.");
        }

        // Slot capacity cannot exceed station capacity
        if (request.CapacityKw >
            station.CapacityKw)
        {
            throw new InvalidOperationException(
                "Slot capacity cannot exceed station capacity.");
        }

        // Available capacity must be valid
        if (request.AvailableCapacityKw < 0 ||
            request.AvailableCapacityKw >
            request.CapacityKw)
        {
            throw new InvalidOperationException(
                "Available capacity must be between 0 and total capacity.");
        }

        slot.SlotDate =
            request.SlotDate.Date;

        slot.StartTime =
            request.StartTime;

        slot.EndTime =
            request.EndTime;

        slot.CapacityKw =
            request.CapacityKw;

        slot.AvailableCapacityKw =
            request.AvailableCapacityKw;

        // Automatically update slot status
        slot.Status =
            request.AvailableCapacityKw > 0
                ? SlotStatus.Available
                : SlotStatus.Full;

        slot.UpdatedAt =
            DateTime.UtcNow;

        await _slotRepository.UpdateAsync(slot);

        return slot;
    }

    // New method to retrieve available slots with optional filters
    public async Task<List<EnergyBookingSlot>> GetAvailableSlotsAsync(string? stationId = null, DateTime? date = null)
    {
        // Responsible: Sithmi - IT23241114
        // Filter available slots by optional station and date criteria.
        var allSlots = await _slotRepository.GetAllAsync();
        var query = allSlots.AsQueryable()
            .Where(s => s.Status == SlotStatus.Available && s.AvailableCapacityKw > 0);

        if (!string.IsNullOrEmpty(stationId))
        {
            query = query.Where(s => s.StationId == stationId);
        }

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(s => s.SlotDate.Date == targetDate);
        }

        return query.ToList();
    }
}
