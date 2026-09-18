using System.Security.Claims;
using System.Text;

using MongoDB.Bson;
using MongoDB.Driver;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.Services;
using SmartSolarMicrogrid.Api.Middleware;
using SmartSolarMicrogrid.Api.SeedData;

var builder = WebApplication.CreateBuilder(args);


// ======================================================
// 1. MongoDB Configuration
// ======================================================

var mongoSettings = builder.Configuration
    .GetSection("MongoDbSettings")
    .Get<MongoDbSettings>();

if (mongoSettings == null)
{
    throw new InvalidOperationException(
        "MongoDbSettings configuration is missing.");
}


// Register MongoDB Client
builder.Services.AddSingleton<IMongoClient>(_ =>
    new MongoClient(
        mongoSettings.ConnectionString));


// Register MongoDB Database
builder.Services.AddSingleton<IMongoDatabase>(
    serviceProvider =>
    {
        var client =
            serviceProvider
                .GetRequiredService<IMongoClient>();

        return client.GetDatabase(
            mongoSettings.DatabaseName);
    });


// ======================================================
// 2. JWT Configuration
// ======================================================

var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>();

if (jwtSettings == null)
{
    throw new InvalidOperationException(
        "JwtSettings configuration is missing.");
}


// Register JwtSettings in Dependency Injection
builder.Services.AddSingleton(jwtSettings);


// ======================================================
// 3. JWT Authentication
// ======================================================

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    jwtSettings.Issuer,

                ValidAudience =
                    jwtSettings.Audience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtSettings.SecretKey))
            };
    });


// ======================================================
// 4. Authorization
// ======================================================

builder.Services.AddAuthorization();


// ======================================================
// 5. Repository Dependency Injection
// ======================================================

// User Repository
builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();


// Station Repository
builder.Services.AddScoped<
    IStationRepository,
    StationRepository>();


// Reservation Repository
builder.Services.AddScoped<
    IReservationRepository,
    ReservationRepository>();


// Slot Repository
builder.Services.AddScoped<
    ISlotRepository,
    SlotRepository>();


// ======================================================
// 6. Service Dependency Injection
// ======================================================

// Authentication Service
builder.Services.AddScoped<
    IAuthService,
    AuthService>();


// User Service
builder.Services.AddScoped<
    IUserService,
    UserService>();


// Station Service
builder.Services.AddScoped<
    IStationService,
    StationService>();


// Slot Service
builder.Services.AddScoped<
    ISlotService,
    SlotService>();


// Reservation Service
builder.Services.AddScoped<
    IReservationService,
    ReservationService>();


// ======================================================
// 7. Seed Data Service
// ======================================================

builder.Services.AddScoped<
    SeedDataService>();


// ======================================================
// 8. Controllers + Swagger
// ======================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();


// ======================================================
// Swagger Configuration
// ======================================================

builder.Services.AddSwaggerGen(options =>
{
    // --------------------------------------------------
    // JWT Bearer Security Definition
    // --------------------------------------------------

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type = SecuritySchemeType.Http,

            Scheme = "bearer",

            BearerFormat = "JWT",

            In = ParameterLocation.Header,

            Description =
                "Enter your JWT token. Example: Bearer {your token}"
        });


    // --------------------------------------------------
    // Apply JWT Security Requirement
    // --------------------------------------------------

    options.AddSecurityRequirement(
        document =>
            new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        document)
                ]
                = new List<string>()
            });
});


// ======================================================
// Build Application
// ======================================================

var app = builder.Build();


// ======================================================
// 9. MongoDB Startup Connection Test
// ======================================================

try
{
    var database =
        app.Services
            .GetRequiredService<IMongoDatabase>();


    await database.RunCommandAsync<BsonDocument>(
        new BsonDocument("ping", 1));


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
// 10. Seed Database
// ======================================================

using (var scope =
    app.Services.CreateScope())
{
    try
    {
        var seedDataService =
            scope.ServiceProvider
                .GetRequiredService<
                    SeedDataService>();


        await seedDataService.SeedAsync();


        Console.WriteLine(
            "========================================");

        Console.WriteLine(
            "Database Seed: SUCCESS");

        Console.WriteLine(
            "========================================");
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            "========================================");

        Console.WriteLine(
            "Database Seed: FAILED");

        Console.WriteLine(
            $"Error: {ex.Message}");

        Console.WriteLine(
            "========================================");
    }
}


// ======================================================
// 11. HTTP Request Pipeline
// ======================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI();
}


// ======================================================
// 12. Global Exception Handling Middleware
// ======================================================

app.UseMiddleware<
    ExceptionHandlingMiddleware>();


// ======================================================
// 13. Authentication Middleware
// ======================================================

app.UseAuthentication();


// ======================================================
// 14. Authorization Middleware
// ======================================================

app.UseAuthorization();


// ======================================================
// 15. Controller Mapping
// ======================================================

app.MapControllers();


// ======================================================
// 16. MongoDB Health Check
// ======================================================

app.MapGet(
    "/api/health",
    async (IMongoDatabase database) =>
    {
        try
        {
            await database.RunCommandAsync<BsonDocument>(
                new BsonDocument("ping", 1));


            return Results.Ok(new
            {
                status = "OK",
                database = "Connected"
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: ex.Message,
                title: "MongoDB Connection Failed");
        }
    });


// ======================================================
// 17. JWT Authentication Test Endpoint
// ======================================================

app.MapGet(
    "/api/auth/test",
    (ClaimsPrincipal user) =>
    {
        return Results.Ok(new
        {
            message =
                "JWT authentication is working.",

            nic =
                user.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

            name =
                user.FindFirst(
                    ClaimTypes.Name)?.Value,

            role =
                user.FindFirst(
                    ClaimTypes.Role)?.Value
        });
    })
    .RequireAuthorization();


// ======================================================
// Run Application
// ======================================================

app.Run();