/*
 * File: StationService.cs
 * Project: Smart Solar Microgrid
 * Description: Implements solar station business operations.
 * Author: Sithmi - IT23241114
 */

using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;
using System.Linq;

namespace SmartSolarMicrogrid.Api.Services;

public class StationService : IStationService
{
    private readonly IStationRepository _stationRepository;
    private readonly IReservationRepository _reservationRepository;

    public StationService(
        IStationRepository stationRepository,
        IReservationRepository reservationRepository)
    {
        // Responsible: Sithmi - IT23241114
        // Store repositories used for station management and reservation checks.
        _stationRepository = stationRepository;
        _reservationRepository = reservationRepository;
    }

    public async Task<List<SolarStationInfo>> GetAllAsync()
    {
        // Responsible: Sithmi - IT23241114
        // Return every configured solar station.
        return await _stationRepository.GetAllAsync();
    }

    public async Task<SolarStationInfo?> GetByIdAsync(
        string id)
    {
        // Responsible: Sithmi - IT23241114
        // Return a solar station by its identifier.
        return await _stationRepository.GetByIdAsync(id);
    }

    public async Task<SolarStationInfo> CreateAsync(
        CreateStationDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Validate uniqueness and create a solar station.
        // Ensure unique station code
        var existing = await _stationRepository.GetByCodeAsync(request.StationCode);
        if (existing != null)
        {
            throw new InvalidOperationException("Station code must be unique.");
        }

        // Capacity must be greater than zero
        if (request.CapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Station capacity must be greater than zero.");
        }

        // Battery storage slots must be greater than zero
        if (request.BatteryStorageSlots <= 0)
        {
            throw new InvalidOperationException(
                "Battery storage slots must be greater than zero.");
        }

        // Validate schedules if provided
        if (request.Schedules != null)
        {
            foreach (var sch in request.Schedules)
            {
                if (sch.OpeningTime >= sch.ClosingTime)
                {
                    throw new InvalidOperationException("Schedule opening time must be before closing time.");
                }
            }
        }

        var station = new SolarStationInfo
        {
            StationCode = request.StationCode,
            StationName = request.StationName,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CapacityKw = request.CapacityKw,
            BatteryStorageSlots = request.BatteryStorageSlots,
            AvailableSlots = request.BatteryStorageSlots,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Schedules = request.Schedules?.Select(s => new StationSchedule
            {
                Day = s.Day,
                OpeningTime = s.OpeningTime,
                ClosingTime = s.ClosingTime,
                IsAvailable = s.IsAvailable
            }).ToList() ?? new List<StationSchedule>()
        };

        await _stationRepository.CreateAsync(station);

        return station;
    }

    public async Task<SolarStationInfo> UpdateAsync(
        string id,
        UpdateStationDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Validate and update an existing solar station.
        var station =
            await _stationRepository.GetByIdAsync(id);

        if (station == null)
        {
            throw new KeyNotFoundException(
                "Station not found.");
        }

        // Capacity must be greater than zero
        if (request.CapacityKw <= 0)
        {
            throw new InvalidOperationException(
                "Station capacity must be greater than zero.");
        }

        // Battery storage slots must be greater than zero
        if (request.BatteryStorageSlots <= 0)
        {
            throw new InvalidOperationException(
                "Battery storage slots must be greater than zero.");
        }

        station.StationName =
            request.StationName;

        station.Latitude =
            request.Latitude;

        station.Longitude =
            request.Longitude;

        station.CapacityKw =
            request.CapacityKw;

        station.BatteryStorageSlots =
            request.BatteryStorageSlots;

        station.UpdatedAt =
            DateTime.UtcNow;

        await _stationRepository.UpdateAsync(station);

        return station;
    }

    public async Task DeactivateAsync(string id)
    {
        // Responsible: Sithmi - IT23241114
        // Deactivate a station only when no active reservation depends on it.
        var station =
            await _stationRepository.GetByIdAsync(id);

        if (station == null)
        {
            throw new KeyNotFoundException(
                "Station not found.");
        }

        var hasActiveReservations =
            await _reservationRepository
                .HasActiveReservationForStationAsync(id);

        if (hasActiveReservations)
        {
            throw new InvalidOperationException(
                "Station cannot be deactivated while active reservations exist.");
        }

        station.IsActive = false;

        station.UpdatedAt =
            DateTime.UtcNow;

        await _stationRepository.UpdateAsync(station);
    }
}
