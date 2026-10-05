/*
 * File: StationSchedule.cs
 * Project: Smart Solar Microgrid
 * Description: Models a solar station operating schedule.
 * Author: Sithmi - IT23241114
 */

namespace SmartSolarMicrogrid.Api.Models;

public class StationSchedule
{
    public string Day { get; set; } = string.Empty;

    public TimeSpan OpeningTime { get; set; }

    public TimeSpan ClosingTime { get; set; }

    public bool IsAvailable { get; set; } = true;
}
