/*
 * File: UpdateReservationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the reservation update request contract.
 * Author: Clerin - IT23402584
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class UpdateReservationDto
{
    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}
