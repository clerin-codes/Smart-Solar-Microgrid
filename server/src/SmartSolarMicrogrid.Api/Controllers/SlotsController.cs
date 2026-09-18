using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SlotsController : ControllerBase
{
    private readonly ISlotService _slotService;

    public SlotsController(
        ISlotService slotService)
    {
        _slotService = slotService;
    }

    // GET: /api/slots
    // Any authenticated user can view slots
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var slots =
            await _slotService.GetAllAsync();

        return Ok(slots);
    }

    // GET: /api/slots/{id}
    // Any authenticated user can view a specific slot
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(
        string id)
    {
        var slot =
            await _slotService.GetByIdAsync(id);

        if (slot == null)
        {
            return NotFound(new
            {
                message = "Slot not found."
            });
        }

        return Ok(slot);
    }

    // GET: /api/slots/station/{stationId}
    // Get all slots belonging to a station
    [HttpGet("station/{stationId}")]
    public async Task<IActionResult> GetByStation(
        string stationId)
    {
        var slots =
            await _slotService
                .GetByStationAsync(stationId);

        return Ok(slots);
    }

    // POST: /api/slots
    // Only Backoffice users can create slots
    [HttpPost]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> Create(
        [FromBody] CreateSlotDto request)
    {
        var slot =
            await _slotService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetById),
            new { id = slot.Id },
            slot);
    }

    // PUT: /api/slots/{id}
    // Only Backoffice users can update slots
    [HttpPut("{id}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateSlotDto request)
    {
        var slot =
            await _slotService.UpdateAsync(
                id,
                request);

        return Ok(slot);
    }
}