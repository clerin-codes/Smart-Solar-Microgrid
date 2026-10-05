/*
 * File: IStationService.cs
 * Project: Smart Solar Microgrid
 * Description: Declares solar station business operations.
 * Author: Sithmi - IT23241114
 */

using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.Interfaces.Services;

public interface IStationService
{
    // Responsible: Sithmi - IT23241114
    Task<List<SolarStationInfo>> GetAllAsync();

    // Responsible: Sithmi - IT23241114
    Task<SolarStationInfo?> GetByIdAsync(
        string id);

    // Responsible: Sithmi - IT23241114
    Task<SolarStationInfo> CreateAsync(
        CreateStationDto request);

    // Responsible: Sithmi - IT23241114
    Task<SolarStationInfo> UpdateAsync(
        string id,
        UpdateStationDto request);

    // Responsible: Sithmi - IT23241114
    Task DeactivateAsync(string id);
}
