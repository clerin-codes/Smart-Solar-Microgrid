/*
 * File: MongoDbSettings.cs
 * Project: Smart Solar Microgrid
 * Description: Defines MongoDB connection and database configuration settings.
 * Author: Shakanyah - IT23214002
 * Author: Sithmi - IT23241114
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 */

namespace SmartSolarMicrogrid.Api.Configuration;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;

    public string DatabaseName { get; set; } = string.Empty;
}
