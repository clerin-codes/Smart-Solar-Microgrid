/*
 * Smart Solar Microgrid Trading System
 * Author: Shakanyah - IT23214002
 * Author: Sithmi - IT23241114
 * Author: Clerin - IT23402584
 * Author: Thuverakan - IT23281332
 * File: Program.cs
 * Purpose: Configures MongoDB, JWT authentication, authorization,
 *          dependency injection, Swagger, validation, CORS, seed data,
 *          middleware and API endpoints.
 */

using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

using MongoDB.Bson;
using MongoDB.Driver;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text.Json.Nodes;

using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Middleware;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.SeedData;
using SmartSolarMicrogrid.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ======================================================
// 1. MongoDB Configuration
// ======================================================

var mongoSettings =
    builder.Configuration
        .GetSection("MongoDbSettings")
        .Get<MongoDbSettings>();

if (mongoSettings == null)
{
    throw new InvalidOperationException(
        "MongoDbSettings configuration is missing.");
}

if (string.IsNullOrWhiteSpace(
        mongoSettings.ConnectionString))
{
    throw new InvalidOperationException(
        "MongoDB connection string is missing.");
}

if (string.IsNullOrWhiteSpace(
        mongoSettings.DatabaseName))
{
    throw new InvalidOperationException(
        "MongoDB database name is missing.");
}

// Register one shared MongoDB client.
builder.Services.AddSingleton<IMongoClient>(
    _ =>
        new MongoClient(
            mongoSettings.ConnectionString));

// Register the configured MongoDB database.
builder.Services.AddSingleton<IMongoDatabase>(
    serviceProvider =>
    {
        // Resolve the shared MongoDB client.
        var client =
            serviceProvider
                .GetRequiredService<IMongoClient>();

        return client.GetDatabase(
            mongoSettings.DatabaseName);
    });

// ======================================================
// 2. JWT Configuration
// ======================================================

var jwtSettings =
    builder.Configuration
        .GetSection("JwtSettings")
        .Get<JwtSettings>();

if (jwtSettings == null)
{
    throw new InvalidOperationException(
        "JwtSettings configuration is missing.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.SecretKey))
{
    throw new InvalidOperationException(
        "JWT SecretKey configuration is missing.");
}

if (Encoding.UTF8.GetByteCount(
        jwtSettings.SecretKey) < 32)
{
    throw new InvalidOperationException(
        "JWT SecretKey must contain at least 32 bytes.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Issuer))
{
    throw new InvalidOperationException(
        "JWT Issuer configuration is missing.");
}

if (string.IsNullOrWhiteSpace(
        jwtSettings.Audience))
{
    throw new InvalidOperationException(
        "JWT Audience configuration is missing.");
}

if (jwtSettings.ExpiryMinutes <= 0)
{
    throw new InvalidOperationException(
        "JWT ExpiryMinutes must be greater than zero.");
}

// Register JWT settings for dependency injection.
builder.Services.AddSingleton(
    jwtSettings);

// ======================================================
// 3. JWT Authentication
// ======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Create the same symmetric signing key used
        // by AuthService during JWT generation.
        var signingKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    jwtSettings.SecretKey))
            {
                KeyId =
                    JwtSettings.SigningKeyId
            };

        options.RequireHttpsMetadata =
            !builder.Environment.IsDevelopment();

        options.SaveToken =
            true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer =
                    true,

                ValidIssuer =
                    jwtSettings.Issuer,

                ValidateAudience =
                    true,

                ValidAudience =
                    jwtSettings.Audience,

                ValidateLifetime =
                    true,

                ValidateIssuerSigningKey =
                    true,

                IssuerSigningKey =
                    signingKey,

                TryAllIssuerSigningKeys =
                    true,

                ClockSkew =
                    TimeSpan.Zero,

                NameClaimType =
                    ClaimTypes.Name,

                RoleClaimType =
                    ClaimTypes.Role
            };

        options.Events =
            new JwtBearerEvents
            {
                OnTokenValidated =
                    async context =>
                    {
                        // Obtain authenticated NIC from JWT claims.
                        var nic =
                            context.Principal?
                                .FindFirst(
                                    ClaimTypes.NameIdentifier)?
                                .Value;

                        if (string.IsNullOrWhiteSpace(
                                nic))
                        {
                            context.Fail(
                                "Missing user identifier.");

                            return;
                        }

                        // Verify current account state in MongoDB.
                        var repository =
                            context.HttpContext
                                .RequestServices
                                .GetRequiredService<
                                    IUserRepository>();

                        var user =
                            await repository
                                .GetByNICAsync(
                                    nic);

                        if (user == null ||
                            !user.IsActive ||
                            user.Status !=
                            AccountStatus.Active)
                        {
                            context.Fail(
                                "The account is inactive.");
                        }
                    }
            };
    });

// ======================================================
// 4. Authorization
// ======================================================

builder.Services.AddAuthorization();

// ======================================================
// 5. CORS Configuration
// ======================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "WebApp",
        policy =>
        {
            // Allow local React development clients.
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "https://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// ======================================================
// 6. Repository Dependency Injection
// ======================================================

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();

builder.Services.AddScoped<
    IStationRepository,
    StationRepository>();

builder.Services.AddScoped<
    IReservationRepository,
    ReservationRepository>();

builder.Services.AddScoped<
    ISlotRepository,
    SlotRepository>();

// ======================================================
// 7. Service Dependency Injection
// ======================================================

builder.Services.AddScoped<
    IAuthService,
    AuthService>();

builder.Services.AddScoped<
    IUserService,
    UserService>();

builder.Services.AddScoped<
    IStationService,
    StationService>();

builder.Services.AddScoped<
    ISlotService,
    SlotService>();

builder.Services.AddScoped<
    IReservationService,
    ReservationService>();

// ======================================================
// 8. Seed Data Service
// ======================================================

builder.Services.AddScoped<
    SeedDataService>();

// ======================================================
// 9. Controllers + JSON Configuration
// ======================================================

builder.Services
    // Enums stay numeric by default (reservation, slot and transaction status are
    // part of the Android/Postman contract). Auth DTOs opt in to string enums
    // individually with [JsonConverter(typeof(JsonStringEnumConverter))].
    .AddControllers();

// ======================================================
// 10. Validation Error Response Configuration
// ======================================================

builder.Services.Configure<ApiBehaviorOptions>(
    options =>
    {
        options.InvalidModelStateResponseFactory =
            context =>
            {
                // Convert validation errors into a
                // consistent client-friendly structure.
                var errors =
                    context.ModelState
                        .Where(
                            entry =>
                                entry.Value != null &&
                                entry.Value.Errors.Count > 0)
                        .ToDictionary(
                            entry =>
                            {
                                if (string.IsNullOrWhiteSpace(
                                        entry.Key))
                                {
                                    return "request";
                                }

                                if (entry.Key.Length == 1)
                                {
                                    return entry.Key
                                        .ToLowerInvariant();
                                }

                                return
                                    char.ToLowerInvariant(
                                        entry.Key[0]) +
                                    entry.Key[1..];
                            },

                            entry =>
                                entry.Value!
                                    .Errors
                                    .Select(
                                        error =>
                                            string.IsNullOrWhiteSpace(
                                                error.ErrorMessage)
                                                ? "Invalid value."
                                                : error.ErrorMessage)
                                    .Distinct()
                                    .ToArray());

                return new BadRequestObjectResult(
                    new
                    {
                        statusCode =
                            400,

                        message =
                            "Validation failed. Please correct the highlighted fields.",

                        errors
                    });
            };
    });

builder.Services.AddEndpointsApiExplorer();

// ======================================================
// 11. Swagger Configuration
// ======================================================

builder.Services.AddSwaggerGen(options =>
{
    // Document UserRole using readable string values.
    options.MapType<UserRole>(
        () =>
            new OpenApiSchema
            {
                Type =
                    JsonSchemaType.String,

                Description =
                    "User role",

                Enum =
                    Enum.GetNames<UserRole>()
                        .Select(
                            name =>
                                (JsonNode)
                                JsonValue.Create(name)!)
                        .ToList()
            });

    // Document AccountStatus using readable string values.
    options.MapType<AccountStatus>(
        () =>
            new OpenApiSchema
            {
                Type =
                    JsonSchemaType.String,

                Description =
                    "Account lifecycle status",

                Enum =
                    Enum.GetNames<AccountStatus>()
                        .Select(
                            name =>
                                (JsonNode)
                                JsonValue.Create(name)!)
                        .ToList()
            });

    // Configure JWT Bearer authentication in Swagger.
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name =
                "Authorization",

            Type =
                SecuritySchemeType.Http,

            Scheme =
                "bearer",

            BearerFormat =
                "JWT",

            In =
                ParameterLocation.Header,

            Description =
                "Enter the JWT access token only. " +
                "Do not manually type the word Bearer."
        });

    // Apply JWT security requirement to Swagger operations.
    options.AddSecurityRequirement(
        document =>
            new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] =
                    []
            });
});

// ======================================================
// Build Application
// ======================================================

var app =
    builder.Build();

// ======================================================
// 12. MongoDB Startup Connection Test
// ======================================================

try
{
    // Resolve configured MongoDB database.
    var database =
        app.Services
            .GetRequiredService<
                IMongoDatabase>();

    await database
        .RunCommandAsync<BsonDocument>(
            new BsonDocument(
                "ping",
                1));

    Console.WriteLine(
        "========================================");

    Console.WriteLine(
        "MongoDB Connection: SUCCESS");

    Console.WriteLine(
        $"Database: {mongoSettings.DatabaseName}");

    Console.WriteLine(
        "========================================");
}
catch (Exception ex)
{
    Console.WriteLine(
        "========================================");

    Console.WriteLine(
        "MongoDB Connection: FAILED");

    Console.WriteLine(
        $"Error: {ex.Message}");

    Console.WriteLine(
        "========================================");
}

// ======================================================
// 13. MongoDB User Indexes
// ======================================================

using (var scope =
       app.Services.CreateScope())
{
    // Ensure DB-level uniqueness and query indexes
    // exist before client traffic is processed.
    var userRepository =
        scope.ServiceProvider
            .GetRequiredService<
                IUserRepository>();

    var reservationRepository =
        scope.ServiceProvider
            .GetRequiredService<
                IReservationRepository>();

    await userRepository
        .EnsureIndexesAsync();

    await reservationRepository
        .EnsureIndexesAsync();
}

// ======================================================
// 14. Seed Database
// ======================================================

var seedDataEnabled =
    app.Environment.IsDevelopment() ||
    app.Configuration.GetValue<bool>(
        "SeedData:Enabled");

if (seedDataEnabled)
{
    using (var scope =
           app.Services.CreateScope())
    {
        // Resolve and execute development seed data.
        var seedDataService =
            scope.ServiceProvider
                .GetRequiredService<
                    SeedDataService>();

        await seedDataService
            .SeedAsync();
    }
}

// ======================================================
// 15. Swagger / Development Pipeline
// ======================================================

if (app.Environment.IsDevelopment())
{
    // Enable Swagger in development.
    app.UseSwagger();

    app.UseSwaggerUI();
}

// ======================================================
// 16. Global Exception Handling
// ======================================================

app.UseMiddleware<
    ExceptionHandlingMiddleware>();

// ======================================================
// 17. CORS
// ======================================================

app.UseCors(
    "WebApp");

// ======================================================
// 18. Authentication
// ======================================================

app.UseAuthentication();

// ======================================================
// 19. Authorization
// ======================================================

app.UseAuthorization();

// ======================================================
// 20. Controller Mapping
// ======================================================

app.MapControllers();

// ======================================================
// 21. MongoDB Health Endpoint
// ======================================================

app.MapGet(
    "/api/health",
    async (
        IMongoDatabase database) =>
    {
        // Verify MongoDB availability.
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
    });

// ======================================================
// 22. JWT Authentication Test Endpoint
// ======================================================

app.MapGet(
        "/api/auth/test",
        (
            ClaimsPrincipal user) =>
        {
            // Return claims from the validated JWT.
            return Results.Ok(
                new
                {
                    message =
                        "JWT authentication is working.",

                    nic =
                        user.FindFirst(
                            ClaimTypes.NameIdentifier)?
                            .Value,

                    name =
                        user.FindFirst(
                            ClaimTypes.Name)?
                            .Value,

                    role =
                        user.FindFirst(
                            ClaimTypes.Role)?
                            .Value
                });
        })
    .RequireAuthorization();

// ======================================================
// Run Application
// ======================================================

app.Run();
