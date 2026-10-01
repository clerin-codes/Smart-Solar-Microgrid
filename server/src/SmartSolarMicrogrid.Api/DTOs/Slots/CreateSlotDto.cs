/*
 * File: CreateSlotDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the energy booking slot creation request contract.
 * Author: Sithmi - IT23241114
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public class CreateSlotDto
{
    public string StationId { get; set; } = string.Empty;

    public DateTime SlotDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public double CapacityKw { get; set; }
}
