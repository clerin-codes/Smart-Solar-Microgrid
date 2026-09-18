namespace SmartSolarMicrogrid.Api.Models;

public class StationSchedule
{
    public string Day { get; set; } = string.Empty;

    public TimeSpan OpeningTime { get; set; }

    public TimeSpan ClosingTime { get; set; }

    public bool IsAvailable { get; set; } = true;
}