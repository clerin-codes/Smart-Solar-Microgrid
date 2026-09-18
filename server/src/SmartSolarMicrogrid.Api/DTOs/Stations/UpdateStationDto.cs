namespace SmartSolarMicrogrid.Api.DTOs.Stations;

public class UpdateStationDto
{
    public string StationName { get; set; } = string.Empty;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public double CapacityKw { get; set; }

    public int BatteryStorageSlots { get; set; }
}