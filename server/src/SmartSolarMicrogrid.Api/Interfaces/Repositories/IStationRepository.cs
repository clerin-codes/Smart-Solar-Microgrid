using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IStationRepository
{
    Task<List<SolarStationInfo>> GetAllAsync();

    Task<SolarStationInfo?> GetByIdAsync(string id);

    Task<SolarStationInfo?> GetByCodeAsync(string stationCode);

    Task CreateAsync(SolarStationInfo station);

    Task UpdateAsync(SolarStationInfo station);
}