using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs.Users;
using SmartSolarMicrogrid.Api.Interfaces.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Backoffice")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(
        IUserService userService)
    {
        _userService = userService;
    }

    // GET: /api/users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users =
            await _userService.GetAllAsync();

        return Ok(users);
    }

    // GET: /api/users/{nic}
    [HttpGet("{nic}")]
    public async Task<IActionResult> GetByNIC(
        string nic)
    {
        var user =
            await _userService.GetByNICAsync(nic);

        if (user == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(user);
    }

    // POST: /api/users
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserDto request)
    {
        var user =
            await _userService.CreateAsync(request);

        return CreatedAtAction(
            nameof(GetByNIC),
            new { nic = user.NIC },
            user);
    }

    // PUT: /api/users/{nic}
    [HttpPut("{nic}")]
    public async Task<IActionResult> Update(
        string nic,
        [FromBody] UpdateUserDto request)
    {
        var user =
            await _userService.UpdateAsync(
                nic,
                request);

        return Ok(user);
    }

    // DELETE: /api/users/{nic}
    [HttpDelete("{nic}")]
    public async Task<IActionResult> Deactivate(
        string nic)
    {
        await _userService.DeactivateAsync(nic);

        return Ok(new
        {
            message = "User deactivated successfully."
        });
    }

    // POST: /api/users/{nic}/reactivate
    [HttpPost("{nic}/reactivate")]
    public async Task<IActionResult> Reactivate(
        string nic)
    {
        await _userService.ReactivateAsync(nic);

        return Ok(new
        {
            message = "User reactivated successfully."
        });
    }
}