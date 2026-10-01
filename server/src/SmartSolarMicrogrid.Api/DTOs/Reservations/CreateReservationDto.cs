/*
 * File: CreateReservationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the reservation creation request contract.
 * Author: Clerin - IT23402584
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class CreateReservationDto
{
    [Required]
    public string StationId { get; set; } = string.Empty;

    [Required]
    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}
