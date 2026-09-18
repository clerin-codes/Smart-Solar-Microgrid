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
        _stationService = stationService;
    }

    // GET: /api/stations
    // Accessible by authenticated users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
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
        await _stationService.DeactivateAsync(id);

        return Ok(new
        {
            message =
                "Station deactivated successfully."
        });
    }
}