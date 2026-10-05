/*
 * File: IReservationService.cs
 * Project: Smart Solar Microgrid
 * Description: Declares reservation workflow business operations.
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

using SmartSolarMicrogrid.Api.DTOs.Reservations;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IReservationService
{
    // Responsible: Clerin - IT23402584
    Task<EnergyReservation> CreateAsync(
        string prosumerNIC,
        CreateReservationDto request);

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation?> GetByIdAsync(
        string id);

    // Responsible: Clerin - IT23402584
    Task<List<EnergyReservation>> GetMyReservationsAsync(
        string prosumerNIC);

    // Responsible: Clerin - IT23402584
    Task<List<EnergyReservation>> GetAllReservationsAsync();

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation> UpdateAsync(
        string prosumerNIC,
        string reservationId,
        UpdateReservationDto request);

    // Responsible: Clerin - IT23402584
    Task CancelAsync(
        string prosumerNIC,
        string reservationId);

    // Responsible: Thuverakan - IT23281332
    Task<EnergyReservation> ApproveAsync(
        string operatorNIC,
        string reservationId);

    // Responsible: Clerin - IT23402584
    Task<EnergyReservation> RejectAsync(
        string operatorNIC,
        string reservationId);

    // Responsible: Thuverakan - IT23281332
    Task<EnergyReservation> VerifyQRAsync(
        string operatorNIC,
        string qrToken);

    // Responsible: Thuverakan - IT23281332
    Task<EnergyReservation> CompleteAsync(
        string operatorNIC,
        string reservationId);
}
