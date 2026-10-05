/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: UserResponseDto.cs
 * Purpose: Safely returns user information without exposing PasswordHash.
 */

using System.Text.Json.Serialization;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.DTOs.Users;

public class UserResponseDto
{
    public string NIC { get; set; } =
        string.Empty;

    public string FullName { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string PhoneNumber { get; set; } =
        string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }

    public bool IsActive { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AccountStatus Status { get; set; }

    public DateTime? DeactivationRequestedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
