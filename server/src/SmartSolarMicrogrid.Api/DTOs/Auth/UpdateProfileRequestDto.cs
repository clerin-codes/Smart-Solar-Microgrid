/*
 * File: UpdateProfileRequestDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the authenticated profile update request contract.
 * Author: Shakanyah - IT23214002
 */

namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class UpdateProfileRequestDto
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;
}
