/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: ChangePasswordDto.cs
 * Purpose: Validates authenticated password-change requests.
 */

using System.ComponentModel.DataAnnotations;

using SmartSolarMicrogrid.Api.Validation;

namespace SmartSolarMicrogrid.Api.DTOs.Users;

public class ChangePasswordDto
{
    [Required(
        ErrorMessage =
            "Current password is required.")]
    [StringLength(
        128,
        ErrorMessage =
            "Current password must not exceed 128 characters.")]
    public string CurrentPassword { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage =
            "New password is required.")]
    [StrongPassword]
    public string NewPassword { get; set; } =
        string.Empty;

    [Required(
        ErrorMessage =
            "Please confirm the new password.")]
    [Compare(
        nameof(NewPassword),
        ErrorMessage =
            "New password and confirmation do not match.")]
    public string ConfirmNewPassword { get; set; } =
        string.Empty;
}