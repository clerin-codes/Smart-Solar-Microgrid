namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class LoginRequestDto
{
    public string NIC { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}