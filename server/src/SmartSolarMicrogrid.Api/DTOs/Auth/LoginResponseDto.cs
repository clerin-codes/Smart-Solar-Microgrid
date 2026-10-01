/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: LoginResponseDto.cs
 * Purpose: Returns authenticated user and JWT information.
 */

using System.Text.Json.Serialization;
using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } =
        string.Empty;

    public string TokenType { get; set; } =
        "Bearer";

    public DateTime ExpiresAtUtc { get; set; }

    public string NIC { get; set; } =
        string.Empty;

    public string FullName { get; set; } =
        string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AccountStatus AccountStatus { get; set; }
}
