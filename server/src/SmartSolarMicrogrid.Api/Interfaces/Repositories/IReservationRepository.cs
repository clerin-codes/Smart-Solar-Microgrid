/*
 * File: IReservationRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Declares persistence operations for energy reservations.
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IReservationRepository
{
    // Responsible: Clerin - IT23402584
    Task EnsureIndexesAsync();

    // Responsible: Clerin - IT23402584
    Task<List<EnergyReservation>> GetAllAsync();

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation?> GetByIdAsync(
        string id);

    // Responsible: Clerin - IT23402584
    Task<List<EnergyReservation>> GetByProsumerAsync(
        string nic);

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation?> GetActiveReservationForProsumerAsync(
        string nic,
        string slotId,
        DateTime reservationDate);

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation?> GetActiveReservationForSlotAsync(
        string slotId,
        DateTime reservationDate);

    // Responsible: Clerin - IT23402584
    Task<bool> HasActiveReservationForStationAsync(
        string stationId);

    // Responsible: Clerin - IT23402584
    Task CreateAsync(
        EnergyReservation reservation);

    // Responsible: Clerin - IT23402584
    Task UpdateAsync(
        EnergyReservation reservation);
}
