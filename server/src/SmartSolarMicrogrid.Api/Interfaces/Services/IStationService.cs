using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IStationService
{
    Task<List<SolarStationInfo>> GetAllAsync();

    Task<SolarStationInfo?> GetByIdAsync(
        string id);

    Task<SolarStationInfo> CreateAsync(
        CreateStationDto request);

    Task<SolarStationInfo> UpdateAsync(
        string id,
        UpdateStationDto request);

    Task DeactivateAsync(string id);
}