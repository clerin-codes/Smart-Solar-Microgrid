/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: StrongPasswordAttribute.cs
 * Purpose: Provides reusable server-side validation for account password strength.
 */

using System.ComponentModel.DataAnnotations;

namespace SmartSolarMicrogrid.Api.Validation;

[AttributeUsage(
    AttributeTargets.Property |
    AttributeTargets.Field |
    AttributeTargets.Parameter)]
public class StrongPasswordAttribute : ValidationAttribute
{
    public StrongPasswordAttribute()
    {
        // Provide a safe fallback message if a caller does not use the detailed validation result.
        ErrorMessage =
            "Password does not meet the required security policy.";
    }

    protected override ValidationResult? IsValid(
        object? value,
        ValidationContext validationContext)
    {
        // Let RequiredAttribute handle missing values and validate only supplied passwords here.
        if (value == null)
        {
            return ValidationResult.Success;
        }

        var password =
            value.ToString() ??
            string.Empty;

        var failures =
            new List<string>();

        // Enforce length, character diversity and safe whitespace/control-character rules.
        if (password.Length is < 12 or > 128)
        {
            failures.Add(
                "Password must contain between 12 and 128 characters.");
        }

        if (!password.Any(
                char.IsUpper))
        {
            failures.Add(
                "Password must contain at least one uppercase letter.");
        }

        if (!password.Any(
                char.IsLower))
        {
            failures.Add(
                "Password must contain at least one lowercase letter.");
        }

        if (!password.Any(
                char.IsDigit))
        {
            failures.Add(
                "Password must contain at least one number.");
        }

        if (!password.Any(
                character =>
                    char.IsPunctuation(character) ||
                    char.IsSymbol(character)))
        {
            failures.Add(
                "Password must contain at least one special character.");
        }

        if (password !=
            password.Trim())
        {
            failures.Add(
                "Password must not begin or end with spaces.");
        }

        if (password.Any(
                char.IsControl))
        {
            failures.Add(
                "Password must not contain control characters.");
        }

        return failures.Count == 0
            ? ValidationResult.Success
            : new ValidationResult(
                string.Join(
                    " ",
                    failures));
    }
}