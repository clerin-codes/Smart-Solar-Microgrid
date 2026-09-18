using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.DTOs.Users;

public class CreateUserDto
{
    public string NIC { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public UserRole Role { get; set; }
}