/*
 * Smart Solar Microgrid Trading System
 *
 * File: SeedDataService.cs
 * Member 1 Responsibility: Authentication and Accounts
 *
 * Purpose:
 * Creates controlled development-only sample data required for
 * authentication and end-to-end integration testing.
 *
 * The service seeds:
 * - Backoffice account
 * - Grid Operator account
 * - Active demonstration Prosumer account
 * - Shared development solar stations
 * - Shared development energy booking slots
 *
 * Security:
 * - Seed passwords are never hardcoded in source code.
 * - Passwords are loaded from configuration / User Secrets.
 * - Passwords follow the same strong-password policy as real accounts.
 * - BCrypt hashing uses the application's configured work factor.
 * - Seed execution is restricted to the Development environment.
 * - Existing records are not overwritten.
 *
 * Important:
 * Real Prosumer registration must use POST /api/Auth/register-prosumer.
 * That workflow creates a PendingActivation account which must be
 * activated by a Backoffice officer.
 */

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using SmartSolarMicrogrid.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace SmartSolarMicrogrid.Api.SeedData;

public class SeedDataService
{
    private const int PasswordWorkFactor = 12;

    private readonly IMongoDatabase _database;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<SeedDataService> _logger;

    public SeedDataService(
        IMongoDatabase database,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<SeedDataService> logger)
    {
        // Store dependencies required for controlled development seeding.
        _database = database;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>
    /// Seeds development accounts and shared integration data when
    /// database seeding is explicitly enabled.
    /// </summary>
    public async Task SeedAsync(
        CancellationToken cancellationToken = default)
    {
        // Never create development sample data outside Development.
        if (!_environment.IsDevelopment())
        {
            _logger.LogInformation(
                "Database seeding skipped because the environment is not Development.");

            return;
        }

        // Require an explicit configuration switch before inserting sample data.
        var seedEnabled =
            _configuration.GetValue<bool>(
                "SeedData:Enabled");

        if (!seedEnabled)
        {
            _logger.LogInformation(
                "Database seeding is disabled.");

            return;
        }

        // Seed application users before data that may depend on those accounts.
        await SeedUsersAsync(
            cancellationToken);

        // Seed the known development stations and obtain their database IDs.
        var stationIds =
            await SeedStationsAsync(
                cancellationToken);

        // Seed future energy slots connected to the seeded stations.
        await SeedSlotsAsync(
            stationIds,
            cancellationToken);

        _logger.LogInformation(
            "Development database seeding completed successfully.");
    }

    // =====================================================
    // Member 1 - Authentication and Account Seed Data
    // =====================================================

    /// <summary>
    /// Creates repeatable development accounts for role-based testing.
    /// </summary>
    private async Task SeedUsersAsync(
        CancellationToken cancellationToken)
    {
        // Load seed passwords securely from configuration or User Secrets.
        var backofficePassword =
            GetRequiredSeedPassword(
                "BackofficePassword");

        var gridOperatorPassword =
            GetRequiredSeedPassword(
                "GridOperatorPassword");

        var prosumerPassword =
            GetRequiredSeedPassword(
                "ProsumerPassword");

        // Apply the same strong-password rules to all development accounts.
        ValidateSeedPassword(
            backofficePassword,
            "Backoffice");

        ValidateSeedPassword(
            gridOperatorPassword,
            "Grid Operator");

        ValidateSeedPassword(
            prosumerPassword,
            "Prosumer");

        var collection =
            _database.GetCollection<UserDetails>(
                "UserDetails");

        // Seed an active Backoffice account for administration testing.
        await SeedUserIfMissingAsync(
            collection,
            new UserDetails
            {
                NIC = "200000000001",

                FullName =
                    "System Backoffice Admin",

                Email =
                    "admin@smartsolar.local",

                PhoneNumber =
                    "0770000001",

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        backofficePassword,
                        PasswordWorkFactor),

                Role =
                    UserRole.Backoffice,

                IsActive =
                    true,

                Status =
                    AccountStatus.Active,

                DeactivationRequestedAt =
                    null
            },
            cancellationToken);

        // Seed an active Grid Operator account for operational testing.
        await SeedUserIfMissingAsync(
            collection,
            new UserDetails
            {
                NIC = "200000000002",

                FullName =
                    "Grid Operator",

                Email =
                    "operator@smartsolar.local",

                PhoneNumber =
                    "0770000002",

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        gridOperatorPassword,
                        PasswordWorkFactor),

                Role =
                    UserRole.GridOperator,

                IsActive =
                    true,

                Status =
                    AccountStatus.Active,

                DeactivationRequestedAt =
                    null
            },
            cancellationToken);

        /*
         * This account is intentionally already active.
         *
         * It is only a development fixture used by reservation,
         * QR-verification and integration testing.
         *
         * Real Prosumer self-registration must use:
         * POST /api/Auth/register-prosumer
         *
         * Real registration creates:
         * Status = PendingActivation
         * IsActive = false
         *
         * A Backoffice officer must then activate the account.
         */
        await SeedUserIfMissingAsync(
            collection,
            new UserDetails
            {
                NIC = "200000000003",

                FullName =
                    "Demo Solar Prosumer",

                Email =
                    "prosumer@smartsolar.local",

                PhoneNumber =
                    "0770000003",

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        prosumerPassword,
                        PasswordWorkFactor),

                Role =
                    UserRole.Prosumer,

                IsActive =
                    true,

                Status =
                    AccountStatus.Active,

                DeactivationRequestedAt =
                    null
            },
            cancellationToken);
    }

    /// <summary>
    /// Inserts a development user only when its NIC and email
    /// are not already present in MongoDB.
    /// </summary>
    private async Task SeedUserIfMissingAsync(
        IMongoCollection<UserDetails> collection,
        UserDetails user,
        CancellationToken cancellationToken)
    {
        // Check NIC first because NIC is the UserDetails primary key.
        var existingByNic =
            await collection
                .Find(
                    existing =>
                        existing.NIC ==
                        user.NIC)
                .FirstOrDefaultAsync(
                    cancellationToken);

        if (existingByNic != null)
        {
            _logger.LogInformation(
                "Seed user with NIC {NIC} already exists. Skipping.",
                user.NIC);

            return;
        }

        // Protect the unique-email constraint before attempting insertion.
        var existingByEmail =
            await collection
                .Find(
                    existing =>
                        existing.Email ==
                        user.Email)
                .FirstOrDefaultAsync(
                    cancellationToken);

        if (existingByEmail != null)
        {
            _logger.LogWarning(
                "Seed user {NIC} was skipped because email {Email} already exists.",
                user.NIC,
                user.Email);

            return;
        }

        // Apply consistent UTC audit timestamps immediately before insertion.
        var now =
            DateTime.UtcNow;

        user.CreatedAt =
            now;

        user.UpdatedAt =
            now;

        await collection.InsertOneAsync(
            user,
            cancellationToken:
                cancellationToken);

        _logger.LogInformation(
            "Seed user created: {Role} - {NIC}.",
            user.Role,
            user.NIC);
    }

    /// <summary>
    /// Reads a required seed password from configuration.
    /// </summary>
    private string GetRequiredSeedPassword(
        string configurationKey)
    {
        // Read the credential from SeedData configuration or User Secrets.
        var password =
            _configuration[
                $"SeedData:{configurationKey}"];

        if (string.IsNullOrWhiteSpace(
                password))
        {
            throw new InvalidOperationException(
                $"SeedData:{configurationKey} is required when development database seeding is enabled.");
        }

        return password;
    }

    /// <summary>
    /// Ensures a development password follows the application
    /// strong-password policy before it is hashed and stored.
    /// </summary>
    private static void ValidateSeedPassword(
        string password,
        string accountName)
    {
        // Validate length, casing, number, special character and surrounding spaces.
        var valid =
            password.Length >= 12 &&
            password.Length <= 128 &&
            password ==
            password.Trim() &&
            password.Any(
                char.IsUpper) &&
            password.Any(
                char.IsLower) &&
            password.Any(
                char.IsDigit) &&
            password.Any(
                character =>
                    !char.IsLetterOrDigit(
                        character));

        if (!valid)
        {
            throw new InvalidOperationException(
                $"{accountName} seed password must contain 12-128 characters, uppercase, lowercase, number and special character, with no leading or trailing spaces.");
        }
    }

    // =====================================================
    // Shared Development Station Seed Data
    // =====================================================

    /// <summary>
    /// Creates the known development stations when they do not already exist
    /// and returns their MongoDB identifiers for slot seeding.
    /// </summary>
    private async Task<List<string>> SeedStationsAsync(
        CancellationToken cancellationToken)
    {
        // Obtain the shared station collection used by integration fixtures.
        var collection =
            _database.GetCollection<SolarStationInfo>(
                "SolarStationInfo");

        var station1 =
            CreateStation(
                stationCode:
                    "SS-JFN-001",
                stationName:
                    "Jaffna Solar Station",
                latitude:
                    9.6615,
                longitude:
                    80.0255,
                capacityKw:
                    100,
                batteryStorageSlots:
                    10);

        var station2 =
            CreateStation(
                stationCode:
                    "SS-MAL-001",
                stationName:
                    "Malabe Solar Station",
                latitude:
                    6.9147,
                longitude:
                    79.9733,
                capacityKw:
                    80,
                batteryStorageSlots:
                    8);

        // Insert each station independently so an existing station does not block the other.
        var station1Id =
            await GetOrCreateStationAsync(
                collection,
                station1,
                cancellationToken);

        var station2Id =
            await GetOrCreateStationAsync(
                collection,
                station2,
                cancellationToken);

        return new List<string>
        {
            station1Id,
            station2Id
        };
    }

    /// <summary>
    /// Builds a station fixture using the shared development schedule.
    /// </summary>
    private static SolarStationInfo CreateStation(
        string stationCode,
        string stationName,
        double latitude,
        double longitude,
        double capacityKw,
        int batteryStorageSlots)
    {
        // Create consistent station fixture values and UTC audit timestamps.
        var now =
            DateTime.UtcNow;

        return new SolarStationInfo
        {
            StationCode =
                stationCode,

            StationName =
                stationName,

            Latitude =
                latitude,

            Longitude =
                longitude,

            CapacityKw =
                capacityKw,

            BatteryStorageSlots =
                batteryStorageSlots,

            AvailableSlots =
                batteryStorageSlots,

            Schedules =
                BuildWeeklySchedule(),

            IsActive =
                true,

            CreatedAt =
                now,

            UpdatedAt =
                now
        };
    }

    /// <summary>
    /// Returns an existing development station or inserts it when missing.
    /// </summary>
    private async Task<string> GetOrCreateStationAsync(
        IMongoCollection<SolarStationInfo> collection,
        SolarStationInfo station,
        CancellationToken cancellationToken)
    {
        // Use the stable station code to make station seeding idempotent.
        var existing =
            await collection
                .Find(
                    current =>
                        current.StationCode ==
                        station.StationCode)
                .FirstOrDefaultAsync(
                    cancellationToken);

        if (existing != null)
        {
            _logger.LogInformation(
                "Seed station {StationCode} already exists. Skipping.",
                station.StationCode);

            return existing.Id;
        }

        await collection.InsertOneAsync(
            station,
            cancellationToken:
                cancellationToken);

        _logger.LogInformation(
            "Seed station created: {StationCode}.",
            station.StationCode);

        return station.Id;
    }

    /// <summary>
    /// Builds the standard seven-day operating schedule
    /// used by the development stations.
    /// </summary>
    private static List<StationSchedule> BuildWeeklySchedule()
    {
        // Use weekday and weekend hours consistently for both seed stations.
        return new List<StationSchedule>
        {
            CreateSchedule(
                "Monday",
                8,
                18),

            CreateSchedule(
                "Tuesday",
                8,
                18),

            CreateSchedule(
                "Wednesday",
                8,
                18),

            CreateSchedule(
                "Thursday",
                8,
                18),

            CreateSchedule(
                "Friday",
                8,
                18),

            CreateSchedule(
                "Saturday",
                9,
                17),

            CreateSchedule(
                "Sunday",
                9,
                17)
        };
    }

    /// <summary>
    /// Creates one available station schedule entry.
    /// </summary>
    private static StationSchedule CreateSchedule(
        string day,
        int openingHour,
        int closingHour)
    {
        // Construct a single reusable daily operating schedule.
        return new StationSchedule
        {
            Day =
                day,

            OpeningTime =
                new TimeSpan(
                    openingHour,
                    0,
                    0),

            ClosingTime =
                new TimeSpan(
                    closingHour,
                    0,
                    0),

            IsAvailable =
                true
        };
    }

    // =====================================================
    // Shared Development Energy Slot Seed Data
    // =====================================================

    /// <summary>
    /// Creates future development energy slots for the two
    /// known seed stations without creating duplicates.
    /// </summary>
    private async Task SeedSlotsAsync(
        IReadOnlyList<string> stationIds,
        CancellationToken cancellationToken)
    {
        // Two station IDs are required because fixture slots reference both stations.
        if (stationIds.Count < 2)
        {
            _logger.LogWarning(
                "Energy slot seeding skipped because the required seed stations are unavailable.");

            return;
        }

        var collection =
            _database.GetCollection<EnergyBookingSlot>(
                "EnergyBookingSlots");

        // Keep development slots inside the reservation system's future-date window.
        var slotDate =
            DateTime.UtcNow
                .Date
                .AddDays(1);

        var slots =
            new List<EnergyBookingSlot>
            {
                // Jaffna Solar Station development slots.
                CreateSlot(
                    stationIds[0],
                    slotDate,
                    new TimeSpan(
                        9,
                        0,
                        0),
                    new TimeSpan(
                        10,
                        0,
                        0),
                    20),

                CreateSlot(
                    stationIds[0],
                    slotDate,
                    new TimeSpan(
                        10,
                        0,
                        0),
                    new TimeSpan(
                        11,
                        0,
                        0),
                    20),

                CreateSlot(
                    stationIds[0],
                    slotDate,
                    new TimeSpan(
                        11,
                        0,
                        0),
                    new TimeSpan(
                        12,
                        0,
                        0),
                    30),

                // Malabe Solar Station development slots.
                CreateSlot(
                    stationIds[1],
                    slotDate,
                    new TimeSpan(
                        9,
                        0,
                        0),
                    new TimeSpan(
                        10,
                        0,
                        0),
                    15),

                CreateSlot(
                    stationIds[1],
                    slotDate,
                    new TimeSpan(
                        14,
                        0,
                        0),
                    new TimeSpan(
                        15,
                        0,
                        0),
                    25)
            };

        foreach (var slot in slots)
        {
            // Insert each known slot only when the same station/date/time slot is absent.
            await SeedSlotIfMissingAsync(
                collection,
                slot,
                cancellationToken);
        }
    }

    /// <summary>
    /// Creates one available development energy slot.
    /// </summary>
    private static EnergyBookingSlot CreateSlot(
        string stationId,
        DateTime slotDate,
        TimeSpan startTime,
        TimeSpan endTime,
        double capacityKw)
    {
        // Initialize the slot with its full capacity available for reservations.
        var now =
            DateTime.UtcNow;

        return new EnergyBookingSlot
        {
            StationId =
                stationId,

            SlotDate =
                slotDate,

            StartTime =
                startTime,

            EndTime =
                endTime,

            CapacityKw =
                capacityKw,

            AvailableCapacityKw =
                capacityKw,

            Status =
                SlotStatus.Available,

            CreatedAt =
                now,

            UpdatedAt =
                now
        };
    }

    /// <summary>
    /// Inserts an energy slot only when an identical station/date/time
    /// fixture does not already exist.
    /// </summary>
    private async Task SeedSlotIfMissingAsync(
        IMongoCollection<EnergyBookingSlot> collection,
        EnergyBookingSlot slot,
        CancellationToken cancellationToken)
    {
        // Identify a slot using its station, date and complete time range.
        var existing =
            await collection
                .Find(
                    current =>
                        current.StationId ==
                            slot.StationId &&
                        current.SlotDate ==
                            slot.SlotDate &&
                        current.StartTime ==
                            slot.StartTime &&
                        current.EndTime ==
                            slot.EndTime)
                .AnyAsync(
                    cancellationToken);

        if (existing)
        {
            _logger.LogInformation(
                "Seed slot already exists for station {StationId} at {StartTime}.",
                slot.StationId,
                slot.StartTime);

            return;
        }

        await collection.InsertOneAsync(
            slot,
            cancellationToken:
                cancellationToken);

        _logger.LogInformation(
            "Seed slot created for station {StationId} at {StartTime}.",
            slot.StationId,
            slot.StartTime);
    }
}