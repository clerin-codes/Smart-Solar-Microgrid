/*
 * Smart Solar Microgrid Trading System
 * File: MongoDbSettings.cs
 * Responsibility: Shared Backend Configuration
 * Purpose: Defines strongly typed MongoDB connection and database configuration settings
 *          used by the ASP.NET Core Web API.
 *
 * Team Members:
 * - Sahanya - IT23214002
 * - Sithmi - IT23241114
 * - Clerin - IT23402584
 * - Thuverakan - IT23281332
 */

namespace SmartSolarMicrogrid.Api.Configuration;

/// <summary>
/// Represents the MongoDB configuration values loaded from application configuration.
/// </summary>
public class MongoDbSettings
{
    /// <summary>
    /// Gets or sets the MongoDB server connection string.
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the MongoDB database name used by the application.
    /// </summary>
    public string DatabaseName { get; set; } = string.Empty;
}