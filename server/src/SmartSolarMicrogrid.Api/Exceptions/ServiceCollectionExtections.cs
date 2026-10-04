/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: ServiceCollectionExtensions.cs
 * Purpose: Keeps Program.cs small by centralizing MongoDB, JWT authentication,
 *          authorization, CORS, validation, Swagger and dependency registration.
 */

using System.Security.Claims;
using System.Text;
using System.Text.Json.Nodes;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Configuration;
using SmartSolarMicrogrid.Api.Interfaces.Repositories;
using SmartSolarMicrogrid.Api.Interfaces.Services;
using SmartSolarMicrogrid.Api.Models;
using SmartSolarMicrogrid.Api.Repositories;
using SmartSolarMicrogrid.Api.SeedData;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSmartSolarMicrogridApi(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        // Resolve required infrastructure settings once and fail fast when invalid.
        var mongoSettings = GetRequiredMongoSettings(configuration);
        var jwtSettings = GetRequiredJwtSettings(configuration);

        services.AddSingleton(mongoSettings);
        services.AddSingleton(jwtSettings);

        AddMongoDb(
            services,
            mongoSettings);

        AddJwtAuthentication(
            services,
            jwtSettings,
            environment);

        services.AddAuthorization();

        AddCors(
            services,
            configuration);

        AddRepositories(
            services);

        AddApplicationServices(
            services);

        services.AddScoped<SeedDataService>();

        AddControllersAndValidation(
            services);

        AddSwagger(
            services);

        return services;
    }

    private static MongoDbSettings GetRequiredMongoSettings(
        IConfiguration configuration)
    {
        // Validate MongoDB settings before the application starts serving traffic.
        var settings =
            configuration
                .GetSection("MongoDbSettings")
                .Get<MongoDbSettings>();

        if (settings == null)
        {
            throw new InvalidOperationException(
                "MongoDbSettings configuration is missing.");
        }

        if (string.IsNullOrWhiteSpace(
                settings.ConnectionString))
        {
            throw new InvalidOperationException(
                "MongoDB connection string is missing.");
        }

        if (string.IsNullOrWhiteSpace(
                settings.DatabaseName))
        {
            throw new InvalidOperationException(
                "MongoDB database name is missing.");
        }

        return settings;
    }

    private static JwtSettings GetRequiredJwtSettings(
        IConfiguration configuration)
    {
        // Validate JWT settings early so insecure or incomplete signing setup cannot start.
        var settings =
            configuration
                .GetSection("JwtSettings")
                .Get<JwtSettings>();

        if (settings == null)
        {
            throw new InvalidOperationException(
                "JwtSettings configuration is missing.");
        }

        if (string.IsNullOrWhiteSpace(
                settings.SecretKey))
        {
            throw new InvalidOperationException(
                "JWT SecretKey configuration is missing.");
        }

        if (Encoding.UTF8.GetByteCount(
                settings.SecretKey) < 32)
        {
            throw new InvalidOperationException(
                "JWT SecretKey must contain at least 32 bytes.");
        }

        if (string.IsNullOrWhiteSpace(
                settings.Issuer))
        {
            throw new InvalidOperationException(
                "JWT Issuer configuration is missing.");
        }

        if (string.IsNullOrWhiteSpace(
                settings.Audience))
        {
            throw new InvalidOperationException(
                "JWT Audience configuration is missing.");
        }

        if (settings.ExpiryMinutes <= 0)
        {
            throw new InvalidOperationException(
                "JWT ExpiryMinutes must be greater than zero.");
        }

        return settings;
    }

    private static void AddMongoDb(
        IServiceCollection services,
        MongoDbSettings settings)
    {
        // Register one MongoDB client and one configured database for the API process.
        services.AddSingleton<IMongoClient>(
            _ =>
                new MongoClient(
                    settings.ConnectionString));

        services.AddSingleton<IMongoDatabase>(
            serviceProvider =>
            {
                // Reuse the shared client instead of creating a client per request.
                var client =
                    serviceProvider
                        .GetRequiredService<IMongoClient>();

                return client.GetDatabase(
                    settings.DatabaseName);
            });
    }

    private static void AddJwtAuthentication(
        IServiceCollection services,
        JwtSettings settings,
        IHostEnvironment environment)
    {
        // Configure signature, issuer, audience and lifetime validation for JWT access tokens.
        services
            .AddAuthentication(
                JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var signingKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            settings.SecretKey))
                    {
                        KeyId =
                            JwtSettings.SigningKeyId
                    };

                options.RequireHttpsMetadata =
                    !environment.IsDevelopment();

                options.SaveToken =
                    true;

                options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        ValidateIssuer =
                            true,

                        ValidIssuer =
                            settings.Issuer,

                        ValidateAudience =
                            true,

                        ValidAudience =
                            settings.Audience,

                        ValidateLifetime =
                            true,

                        ValidateIssuerSigningKey =
                            true,

                        IssuerSigningKey =
                            signingKey,

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
                                // Read the immutable NIC claim used as the MongoDB account identifier.
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

                                // Re-check current account state so deactivated users cannot keep using old JWTs.
                                var repository =
                                    context.HttpContext
                                        .RequestServices
                                        .GetRequiredService<IUserRepository>();

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
    }

    private static void AddCors(
        IServiceCollection services,
        IConfiguration configuration)
    {
        // Load browser origins from configuration so IIS/deployment URLs are not hardcoded.
        var allowedOrigins =
            configuration
                .GetSection(
                    "Cors:AllowedOrigins")
                .Get<string[]>() ??
            Array.Empty<string>();

        if (allowedOrigins.Length == 0)
        {
            throw new InvalidOperationException(
                "At least one CORS allowed origin must be configured in Cors:AllowedOrigins.");
        }

        services.AddCors(options =>
        {
            // Allow only the configured React origins to call the API from a browser.
            options.AddPolicy(
                "WebApp",
                policy =>
                    policy
                        .WithOrigins(
                            allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod());
        });
    }

    private static void AddRepositories(
        IServiceCollection services)
    {
        // Register repository implementations for all backend modules.
        services.AddScoped<
            IUserRepository,
            UserRepository>();

        services.AddScoped<
            IStationRepository,
            StationRepository>();

        services.AddScoped<
            IReservationRepository,
            ReservationRepository>();

        services.AddScoped<
            ISlotRepository,
            SlotRepository>();
    }

    private static void AddApplicationServices(
        IServiceCollection services)
    {
        // Register business services while keeping controllers dependent on interfaces.
        services.AddScoped<
            IAuthService,
            AuthService>();

        services.AddScoped<
            IUserService,
            UserService>();

        services.AddScoped<
            IStationService,
            StationService>();

        services.AddScoped<
            ISlotService,
            SlotService>();

        services.AddScoped<
            IReservationService,
            ReservationService>();
    }

    private static void AddControllersAndValidation(
        IServiceCollection services)
    {
        // Keep non-auth enum serialization unchanged and standardize validation failures.
        services.AddControllers();

        services.Configure<ApiBehaviorOptions>(
            options =>
            {
                options.InvalidModelStateResponseFactory =
                    context =>
                    {
                        // Return field-level validation errors in one predictable client format.
                        var errors =
                            context.ModelState
                                .Where(
                                    entry =>
                                        entry.Value != null &&
                                        entry.Value.Errors.Count > 0)
                                .ToDictionary(
                                    entry =>
                                        ToCamelCase(
                                            entry.Key),

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
                                    StatusCodes.Status400BadRequest,

                                message =
                                    "Validation failed. Please correct the highlighted fields.",

                                errors
                            });
                    };
            });
    }

    private static string ToCamelCase(
        string key)
    {
        // Convert ASP.NET model-state property names to camelCase keys used by clients.
        if (string.IsNullOrWhiteSpace(
                key))
        {
            return "request";
        }

        if (key.Length == 1)
        {
            return key.ToLowerInvariant();
        }

        return
            char.ToLowerInvariant(
                key[0]) +
            key[1..];
    }

    private static void AddSwagger(
        IServiceCollection services)
    {
        // Register Swagger/OpenAPI documentation with JWT Bearer support for API testing.
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            // Display Member 1 role values as readable strings in the Swagger schema.
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

            // Display account lifecycle values as readable strings in Swagger.
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

            // Add the JWT Bearer authorization control used by protected endpoints.
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

            // Preserve the existing Swagger authorization requirement for authenticated testing.
            options.AddSecurityRequirement(
                document =>
                    new OpenApiSecurityRequirement
                    {
                        [
                            new OpenApiSecuritySchemeReference(
                                "Bearer",
                                document)
                        ] =
                            []
                    });
        });
    }
}