/*
 * File: UpdateSlotDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the energy booking slot update request contract.
 * Author: Sithmi - IT23241114
 */

namespace SmartSolarMicrogrid.Api.DTOs.Slots;

public class UpdateSlotDto
{
    public DateTime SlotDate { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public double CapacityKw { get; set; }

    public double AvailableCapacityKw { get; set; }
}
