/*
 * File: StationsController.cs
 * Project: Smart Solar Microgrid
 * Description: Exposes solar station query and management endpoints.
 * Author: Sithmi - IT23241114
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StationsController : ControllerBase
{
    private readonly IStationService _stationService;

    public StationsController(
        IStationService stationService)
    {
        // Responsible: Sithmi - IT23241114
        // Store the station service used by each endpoint.
        _stationService = stationService;
    }

    // GET: /api/stations
    // Accessible by authenticated users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Responsible: Sithmi - IT23241114
        // Return all solar stations visible to authenticated users.
        var stations =
            await _stationService.GetAllAsync();

        return Ok(stations);
    }

    // GET: /api/stations/{id}
    // Accessible by authenticated users
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        string id)
    {
        // Responsible: Sithmi - IT23241114
        // Return the station identified by the route value when it exists.
        var station =
            await _stationService.GetByIdAsync(id);

        if (station == null)
        {
            return NotFound(new
            {
                message = "Station not found."
            });
        }

        return Ok(station);
    }

    // POST: /api/stations
    // Only Backoffice users can create stations
    [HttpPost]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> Create(
        [FromBody] CreateStationDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Create a new solar station from the validated request.
        var station =
            await _stationService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = station.Id },
            station);
    }

    // PUT: /api/stations/{id}
    // Only Backoffice users can update stations
    [HttpPut("{id}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateStationDto request)
    {
        // Responsible: Sithmi - IT23241114
        // Update the selected solar station from the validated request.
        var station =
            await _stationService.UpdateAsync(
                id,
                request);

        return Ok(station);
    }

    // DELETE: /api/stations/{id}
    // Only Backoffice users can deactivate stations
    [HttpDelete("{id}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> Deactivate(
        string id)
    {
        // Responsible: Sithmi - IT23241114
        // Deactivate the selected station after service-level validation.
        await _stationService.DeactivateAsync(id);

        return Ok(new
        {
            message =
                "Station deactivated successfully."
        });
    }
}
