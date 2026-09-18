using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Services;

public class SlotService : ISlotService
{
    private readonly ISlotRepository _slotRepository;
    private readonly IStationRepository _stationRepository;

    public SlotService(
        ISlotRepository slotRepository,
        IStationRepository stationRepository)
    {
        _slotRepository = slotRepository;
        _stationRepository = stationRepository;
    }

    public async Task<List<EnergyBookingSlot>> GetAllAsync()
    {
        return await _slotRepository.GetAllAsync();
    }

    public async Task<EnergyBookingSlot?> GetByIdAsync(
        string id)
    {
        return await _slotRepository.GetByIdAsync(id);
    }

    public async Task<List<EnergyBookingSlot>> GetByStationAsync(
        string stationId)
    {
        return await _slotRepository
            .GetByStationAsync(stationId);
    }

    public async Task<EnergyBookingSlot> CreateAsync(
        CreateSlotDto request)
    {
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
            DateTime.UtcNow.Date)
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
            DateTime.UtcNow.Date)
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
}