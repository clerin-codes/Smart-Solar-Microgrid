/*
 * File: CreateReservationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the reservation creation request contract.
 * Author: Clerin - IT23402584
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class CreateReservationDto
{
    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}
