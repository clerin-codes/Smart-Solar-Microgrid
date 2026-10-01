/*
 * File: UpdateStationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the solar station update request contract.
 * Author: Sithmi - IT23241114
 */

using System.Collections.Generic;

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public class UpdateStationDto
{
    public string StationName { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKw { get; set; }

    public int BatteryStorageSlots { get; set; }

    public List<StationScheduleDto> Schedules { get; set; } = new();
}
