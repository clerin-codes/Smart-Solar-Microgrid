/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: WebApplicationExtensions.cs
 * Purpose: Centralizes MongoDB startup validation, account indexes, controlled
 *          development seeding, and the lightweight system health endpoint.
 */

using MongoDB.Bson;
using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.SeedData;

namespace SmartSolarMicrogrid.Api.Extensions;

public static class WebApplicationExtensions
{
    public static async Task InitializeDatabaseAsync(
        this WebApplication app)
    {
        // Fail startup when the required central database cannot be initialized safely.
        using var scope =
            app.Services.CreateScope();

        var logger =
            scope.ServiceProvider
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger(
                    "DatabaseInitialization");

        try
        {
            var database =
                scope.ServiceProvider
                    .GetRequiredService<IMongoDatabase>();

            var settings =
                scope.ServiceProvider
                    .GetRequiredService<MongoDbSettings>();

            // Confirm MongoDB connectivity before creating indexes or seed records.
            await database
                .RunCommandAsync<BsonDocument>(
                    new BsonDocument(
                        "ping",
                        1));

            // Create Member 1 uniqueness/query indexes before any client traffic is served.
            var userRepository =
                scope.ServiceProvider
                    .GetRequiredService<IUserRepository>();

            await userRepository
                .EnsureIndexesAsync();

            // Run optional Development-only seed data; the service itself enforces the environment flag.
            var seedDataService =
                scope.ServiceProvider
                    .GetRequiredService<SeedDataService>();

            await seedDataService
                .SeedAsync();

            logger.LogInformation(
                "MongoDB initialization completed for database {DatabaseName}.",
                settings.DatabaseName);
        }
        catch (Exception exception)
        {
            // A FAT-service API without its server database is not operational, so stop startup.
            logger.LogCritical(
                exception,
                "MongoDB initialization failed. " +
                "The API will not start with an unusable database connection.");

            throw;
        }
    }

    public static void MapSystemHealthEndpoint(
        this WebApplication app)
    {
        // Expose dependency health without returning credentials or internal connection details.
        app.MapGet(
                "/api/health",
                async (
                    IMongoDatabase database) =>
                {
                    try
                    {
                        await database
                            .RunCommandAsync<BsonDocument>(
                                new BsonDocument(
                                    "ping",
                                    1));

                        return Results.Ok(
                            new
                            {
                                status =
                                    "OK",

                                database =
                                    "Connected"
                            });
                    }
                    catch
                    {
                        return Results.Problem(
                            statusCode:
                                StatusCodes
                                    .Status503ServiceUnavailable,

                            title:
                                "Database unavailable",

                            detail:
                                "The database service is currently unavailable.");
                    }
                })
            .AllowAnonymous()
            .WithName(
                "SystemHealth")
            .WithTags(
                "System");
    }
}