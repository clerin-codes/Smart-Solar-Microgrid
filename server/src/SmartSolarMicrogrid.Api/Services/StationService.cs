using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class StationService : IStationService
{
    private readonly IStationRepository _stationRepository;
    private readonly IReservationRepository _reservationRepository;

    public StationService(
        IStationRepository stationRepository,
        IReservationRepository reservationRepository)
    {
        _stationRepository = stationRepository;
        _reservationRepository = reservationRepository;
    }

    public async Task<List<SolarStationInfo>> GetAllAsync()
    {
        return await _stationRepository.GetAllAsync();
    }

    public async Task<SolarStationInfo?> GetByIdAsync(
        string id)
    {
        return await _stationRepository.GetByIdAsync(id);
    }

    public async Task<SolarStationInfo> CreateAsync(
        CreateStationDto request)
    {
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

        var station = new SolarStationInfo
        {
            StationCode = request.StationCode,
            StationName = request.StationName,

            Latitude = request.Latitude,
            Longitude = request.Longitude,

            CapacityKw = request.CapacityKw,

            BatteryStorageSlots =
                request.BatteryStorageSlots,

            AvailableSlots =
                request.BatteryStorageSlots,

            IsActive = true,

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _stationRepository.CreateAsync(station);

        return station;
    }

    public async Task<SolarStationInfo> UpdateAsync(
        string id,
        UpdateStationDto request)
    {
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