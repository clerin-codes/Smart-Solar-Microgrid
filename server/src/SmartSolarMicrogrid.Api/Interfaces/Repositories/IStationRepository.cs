/*
 * File: IStationRepository.cs
 * Project: Smart Solar Microgrid
 * Description: Declares persistence operations for solar stations.
 * Author: Sithmi - IT23241114
 */

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Repositories;

public interface IStationRepository
{
    // Responsible: Sithmi - IT23241114
    Task<List<SolarStationInfo>> GetAllAsync();

    // Responsible: Sithmi - IT23241114
    Task<SolarStationInfo?> GetByIdAsync(string id);

    // Responsible: Sithmi - IT23241114
    Task<SolarStationInfo?> GetByCodeAsync(string stationCode);

    // Responsible: Sithmi - IT23241114
    Task CreateAsync(SolarStationInfo station);

    // Responsible: Sithmi - IT23241114
    Task UpdateAsync(SolarStationInfo station);
}
