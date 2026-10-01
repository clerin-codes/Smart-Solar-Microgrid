/*
 * File: CreateSlotDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the energy booking slot creation request contract.
 * Author: Sithmi - IT23241114
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public class CreateSlotDto
{
    [Required]
    public string StationId { get; set; } = string.Empty;

    public DateTime SlotDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    [Range(0.01, double.MaxValue)]
    public double CapacityKw { get; set; }
}
