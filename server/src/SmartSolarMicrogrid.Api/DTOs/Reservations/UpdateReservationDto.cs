/*
 * File: UpdateReservationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the reservation update request contract.
 * Author: Clerin - IT23402584
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public class UpdateReservationDto
{
    [Required]
    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDate { get; set; }
}
