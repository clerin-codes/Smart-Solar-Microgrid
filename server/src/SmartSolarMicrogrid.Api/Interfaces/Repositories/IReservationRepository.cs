using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IReservationRepository
{
    Task<List<EnergyReservation>> GetAllAsync();

    Task<EnergyReservation?> GetByIdAsync(string id);

    Task<List<EnergyReservation>> GetByProsumerAsync(
        string nic);

    Task<bool> HasDuplicateReservationAsync(
        string nic,
        string slotId,
        DateTime reservationDate);

    Task<bool> HasActiveReservationForStationAsync(
        string stationId);

    Task CreateAsync(EnergyReservation reservation);

    Task UpdateAsync(EnergyReservation reservation);
}