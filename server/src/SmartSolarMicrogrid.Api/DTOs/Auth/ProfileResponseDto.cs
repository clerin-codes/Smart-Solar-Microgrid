/*
 * File: ProfileResponseDto.cs
 * Project: Smart Solar Microgrid
 * Description: Defines the authenticated user profile response contract.
 * Author: Shakanyah - IT23214002
 */

namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class ProfileResponseDto
{
    public string NIC { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    /// <summary>Base64 profile picture, or null when none has been uploaded.</summary>
    public string? ProfileImage { get; set; }
}
