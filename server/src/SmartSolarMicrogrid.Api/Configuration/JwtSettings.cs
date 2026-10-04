/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: JwtSettings.cs
 * Purpose: Defines strongly typed JWT token configuration used by generation and validation.
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public class JwtSettings
{
    // Key identifier is shared by JWT generation and validation metadata.
    public const string SigningKeyId =
        "SmartSolarMicrogridSigningKey";

    public string SecretKey { get; set; } =
        string.Empty;

    public string Issuer { get; set; } =
        string.Empty;

    public string Audience { get; set; } =
        string.Empty;

    public int ExpiryMinutes { get; set; } =
        120;
}