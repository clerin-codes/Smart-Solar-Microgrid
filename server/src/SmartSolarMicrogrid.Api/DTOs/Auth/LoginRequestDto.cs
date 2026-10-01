/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: LoginRequestDto.cs
 * Purpose: Validates authentication credential requests.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class LoginRequestDto
{
    [Required(
        ErrorMessage =
            "NIC is required.")]
    [RegularExpression(
        @"^(?:\d{12}|\d{9}[vVxX])$",
        ErrorMessage =
            "Enter a valid Sri Lankan NIC.")]
    public string NIC { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage =
            "Password is required.")]
    [StringLength(
        128,
        ErrorMessage =
            "Password must not exceed 128 characters.")]
    public string Password { get; set; } =
        string.Empty;
}
