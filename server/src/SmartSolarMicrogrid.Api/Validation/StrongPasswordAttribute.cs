/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: StrongPasswordAttribute.cs
 * Purpose: Provides reusable server-side strong password validation.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Validation;

public class StrongPasswordAttribute : ValidationAttribute
{
    public StrongPasswordAttribute()
    {
        // Provide a general fallback validation message.
        ErrorMessage =
            "Password does not meet the required security policy.";
    }

    protected override ValidationResult? IsValid(
        object? value,
        ValidationContext validationContext)
    {
        // RequiredAttribute is responsible for missing/null values.
        if (value == null)
        {
            return ValidationResult.Success;
        }

        var password =
            value.ToString() ?? string.Empty;

        var failures =
            new List<string>();

        // Enforce a strong but practical password length.
        if (password.Length < 12 ||
            password.Length > 128)
        {
            failures.Add(
                "Password must contain between 12 and 128 characters.");
        }

        // Require at least one uppercase letter.
        if (!password.Any(char.IsUpper))
        {
            failures.Add(
                "Password must contain at least one uppercase letter.");
        }

        // Require at least one lowercase letter.
        if (!password.Any(char.IsLower))
        {
            failures.Add(
                "Password must contain at least one lowercase letter.");
        }

        // Require at least one number.
        if (!password.Any(char.IsDigit))
        {
            failures.Add(
                "Password must contain at least one number.");
        }

        // Require at least one special character.
        if (!password.Any(
                character =>
                    char.IsPunctuation(character) ||
                    char.IsSymbol(character)))
        {
            failures.Add(
                "Password must contain at least one special character.");
        }

        // Reject accidental leading/trailing spaces.
        if (password != password.Trim())
        {
            failures.Add(
                "Password must not begin or end with spaces.");
        }

        // Reject control characters.
        if (password.Any(char.IsControl))
        {
            failures.Add(
                "Password must not contain control characters.");
        }

        return failures.Count == 0
            ? ValidationResult.Success
            : new ValidationResult(
                string.Join(" ", failures));
    }
}