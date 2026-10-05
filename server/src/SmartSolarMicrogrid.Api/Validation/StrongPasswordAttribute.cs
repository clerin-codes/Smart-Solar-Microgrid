/*
 * Smart Solar Microgrid Trading System
 * Author: Sahanya - IT23214002
 * File: StrongPasswordAttribute.cs
 * Purpose: Provides reusable server-side validation for account password strength.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Validation;

/// <summary>
/// Validates that an account password satisfies the application's
/// minimum password-strength requirements.
/// </summary>
[AttributeUsage(
    AttributeTargets.Property |
    AttributeTargets.Field |
    AttributeTargets.Parameter)]
public sealed class StrongPasswordAttribute : ValidationAttribute
{
    /// <summary>
    /// Initializes the password validation attribute with a fallback
    /// validation message.
    /// </summary>
    public StrongPasswordAttribute()
    {
        // Provide a safe fallback message when detailed validation information is unavailable.
        ErrorMessage =
            "Password does not meet the required security policy.";
    }

    /// <summary>
    /// Validates the supplied password against the application's
    /// password-strength policy.
    /// </summary>
    /// <param name="value">
    /// Password value supplied by the request model.
    /// </param>
    /// <param name="validationContext">
    /// Validation context supplied by ASP.NET Core.
    /// </param>
    /// <returns>
    /// ValidationResult.Success when the password is valid;
    /// otherwise, a validation result containing the failed requirements.
    /// </returns>
    protected override ValidationResult? IsValid(
        object? value,
        ValidationContext validationContext)
    {
        // Allow RequiredAttribute to handle missing values and validate only supplied passwords here.
        if (value == null)
        {
            return ValidationResult.Success;
        }

        var password =
            value.ToString() ??
            string.Empty;

        var failures =
            new List<string>();

        // Enforce the permitted password length.
        if (password.Length is < 12 or > 128)
        {
            failures.Add(
                "Password must contain between 12 and 128 characters.");
        }

        // Require at least one uppercase character.
        if (!password.Any(
                char.IsUpper))
        {
            failures.Add(
                "Password must contain at least one uppercase letter.");
        }

        // Require at least one lowercase character.
        if (!password.Any(
                char.IsLower))
        {
            failures.Add(
                "Password must contain at least one lowercase letter.");
        }

        // Require at least one numeric character.
        if (!password.Any(
                char.IsDigit))
        {
            failures.Add(
                "Password must contain at least one number.");
        }

        // Require at least one punctuation or symbol character.
        if (!password.Any(
                character =>
                    char.IsPunctuation(character) ||
                    char.IsSymbol(character)))
        {
            failures.Add(
                "Password must contain at least one special character.");
        }

        // Prevent accidental leading or trailing whitespace.
        if (password !=
            password.Trim())
        {
            failures.Add(
                "Password must not begin or end with spaces.");
        }

        // Reject hidden control characters that should not appear in passwords.
        if (password.Any(
                char.IsControl))
        {
            failures.Add(
                "Password must not contain control characters.");
        }

        // Return all validation failures together so the client can correct them in one attempt.
        return failures.Count == 0
            ? ValidationResult.Success
            : new ValidationResult(
                string.Join(
                    " ",
                    failures));
    }
}