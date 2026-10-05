/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: RegisterProsumerDto.cs
 * Purpose: Validates Solar Prosumer self-registration requests.
 */

using System.ComponentModel.DataAnnotations;

using SmartSolarMicrogrid.Api.Validation;

namespace SmartSolarMicrogrid.Api.DTOs.Auth;

public class RegisterProsumerDto
{
    [Required(
        ErrorMessage = "NIC is required.")]
    [RegularExpression(
        @"^(?:\d{12}|\d{9}[vVxX])$",
        ErrorMessage =
            "Enter a valid Sri Lankan NIC. Use either 12 digits or the old 9-digit format followed by V/X.")]
    public string NIC { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage = "Full name is required.")]
    [StringLength(
        100,
        MinimumLength = 2,
        ErrorMessage =
            "Full name must contain between 2 and 100 characters.")]
    [RegularExpression(
        @"^[\p{L}][\p{L}\p{M}\s.'-]*$",
        ErrorMessage =
            "Full name may contain letters, spaces, apostrophes, periods and hyphens only.")]
    public string FullName { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage = "Email address is required.")]
    [EmailAddress(
        ErrorMessage =
            "Enter a valid email address.")]
    [StringLength(
        254,
        ErrorMessage =
            "Email address must not exceed 254 characters.")]
    public string Email { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage =
            "Mobile phone number is required.")]
    [RegularExpression(
        @"^(?:\+94|0)7\d{8}$",
        ErrorMessage =
            "Enter a valid Sri Lankan mobile number, for example 0771234567 or +94771234567.")]
    public string PhoneNumber { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage = "Password is required.")]
    [StrongPassword]
    public string Password { get; set; } =
        string.Empty;
}
