using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IReservationService
{
    Task<EnergyReservation> CreateAsync(
        string prosumerNIC,
        CreateReservationDto request);

    Task<List<EnergyReservation>> GetAllAsync();

    Task<EnergyReservation?> GetByIdAsync(
        string id);

    Task<List<EnergyReservation>> GetMyReservationsAsync(
        string prosumerNIC);

    Task<EnergyReservation> UpdateAsync(
        string prosumerNIC,
        string reservationId,
        UpdateReservationDto request);

    Task CancelAsync(
        string prosumerNIC,
        string reservationId);

    Task<EnergyReservation> ApproveAsync(
        string operatorNIC,
        string reservationId);

    Task<EnergyReservation> VerifyQRAsync(
        string operatorNIC,
        string qrToken);

    Task<EnergyReservation> CompleteAsync(
        string operatorNIC,
        string reservationId);
}