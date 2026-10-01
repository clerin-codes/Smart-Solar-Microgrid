/*
 * File: StationScheduleDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines a station operating schedule data contract.
 * Author: Sithmi - IT23241114
 */

namespace SmartSolarMicrogrid.Api.DTOs.Stations
{
    public class StationScheduleDto
    {
        public string Day { get; set; } = string.Empty; // e.g., "Monday"
        public TimeSpan OpeningTime { get; set; }
        public TimeSpan ClosingTime { get; set; }
        public bool IsAvailable { get; set; } = true;
    }
}
