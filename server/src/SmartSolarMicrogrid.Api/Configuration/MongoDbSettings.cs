/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: MongoDbSettings.cs
 * Purpose: Defines strongly typed MongoDB connection configuration.
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } =
        string.Empty;

    public string DatabaseName { get; set; } =
        string.Empty;
}