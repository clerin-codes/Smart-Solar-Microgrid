/*
 * File: CreateStationDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the solar station creation request contract.
 * Author: Sithmi - IT23241114
 */

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public class CreateStationDto
{
    [Required]
    [StringLength(30, MinimumLength = 2)]
    public string StationCode { get; set; } = string.Empty;

    [Required]
    [StringLength(120, MinimumLength = 2)]
    public string StationName { get; set; } = string.Empty;

    [Range(-90, 90)]
    public double Latitude { get; set; }

    [Range(-180, 180)]
    public double Longitude { get; set; }

    [Range(0.01, double.MaxValue)]
    public double CapacityKw { get; set; }

    [Range(1, int.MaxValue)]
    public int BatteryStorageSlots { get; set; }

    public List<StationScheduleDto> Schedules { get; set; } = new();
}
