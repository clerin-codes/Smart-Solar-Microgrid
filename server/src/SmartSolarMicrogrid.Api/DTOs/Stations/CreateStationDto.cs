using System.Collections.Generic;

namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public class CreateStationDto
{
    public string StationCode { get; set; } = string.Empty;

    public string StationName { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKw { get; set; }

    public int BatteryStorageSlots { get; set; }

    public List<StationScheduleDto> Schedules { get; set; } = new();
}