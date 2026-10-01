/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * File: JwtSettings.cs
 * Purpose: Defines strongly typed JWT configuration used for
 *          token generation and validation.
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public class JwtSettings
{
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
