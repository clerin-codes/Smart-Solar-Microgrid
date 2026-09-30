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
