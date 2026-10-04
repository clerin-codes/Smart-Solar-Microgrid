/*
 * Smart Solar Microgrid Trading System
 * Member 1 - Authentication and Accounts
 * File: SeedDataService.cs
 * Purpose: Creates controlled development-only sample data for
 *          authentication, stations, and energy booking slots.
 *
 * Security:
 * - Seed passwords are never hardcoded in source code.
 * - Passwords are loaded from development configuration/User Secrets.
 * - Seed execution is restricted to the Development environment.
 * - Existing records are not overwritten.
 */

using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Models;

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

    public async Task SeedAsync(
        CancellationToken cancellationToken = default)
    {
        // Prevent seed data from being created outside Development.
        if (!_environment.IsDevelopment())
        {
            _logger.LogInformation(
                "Database seeding skipped because the environment is not Development.");

            return;
        }

        // Allow developers to explicitly enable or disable seed execution.
        var seedEnabled =
            _configuration.GetValue<bool>(
                "SeedData:Enabled");

        if (!seedEnabled)
        {
            _logger.LogInformation(
                "Database seeding is disabled.");

            return;
        }

        // Seed authentication users first because other modules may use them.
        await SeedUsersAsync(
            cancellationToken);

        // Seed shared station demo data without overwriting existing records.
        var stationIds =
            await SeedStationsAsync(
                cancellationToken);

        // Seed energy slots that reference the seeded stations.
        await SeedSlotsAsync(
            stationIds,
            cancellationToken);

        _logger.LogInformation(
            "Development database seeding completed.");
    }

    // =====================================================
    // Member 1 - Authentication and Account Seed Data
    // =====================================================

    private async Task SeedUsersAsync(
        CancellationToken cancellationToken)
    {
        // Load seed passwords from configuration instead of source code.
        var backofficePassword =
            GetRequiredSeedPassword(
                "BackofficePassword");

        var gridOperatorPassword =
            GetRequiredSeedPassword(
                "GridOperatorPassword");

        var prosumerPassword =
            GetRequiredSeedPassword(
                "ProsumerPassword");

        // Validate seed credentials against the same strong-password policy.
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

        // Seed one active Backoffice account for administration testing.
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
                    AccountStatus.Active
            },
            cancellationToken);

        // Seed one active Grid Operator account for operational testing.
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
                    AccountStatus.Active
            },
            cancellationToken);

        /*
         * This Prosumer is an already-active development fixture used by
         * reservation/QR testing.
         *
         * Real Prosumer self-registration must still use:
         * POST /api/Auth/register-prosumer
         *
         * That workflow creates PendingActivation accounts which require
         * Backoffice activation.
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
                    AccountStatus.Active
            },
            cancellationToken);
    }

    private async Task SeedUserIfMissingAsync(
        IMongoCollection<UserDetails> collection,
        UserDetails user,
        CancellationToken cancellationToken)
    {
        // Check the NIC first because NIC is the UserDetails primary key.
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

        // Prevent development seed data from violating the unique email index.
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

        // Apply consistent UTC audit timestamps before insertion.
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

    private string GetRequiredSeedPassword(
        string configurationKey)
    {
        // Read a password from SeedData configuration/User Secrets.
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

    private static void ValidateSeedPassword(
        string password,
        string accountName)
    {
        // Ensure development users follow the application's strong-password rules.
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

    private async Task<List<string>> SeedStationsAsync(
        CancellationToken cancellationToken)
    {
        // Create the known development stations individually and return their IDs.
        var collection =
            _database.GetCollection<SolarStationInfo>(
                "SolarStationInfo");

        var station1 =
            new SolarStationInfo
            {
                StationCode =
                    "SS-JFN-001",

                StationName =
                    "Jaffna Solar Station",

                Latitude =
                    9.6615,

                Longitude =
                    80.0255,

                CapacityKw =
                    100,

                BatteryStorageSlots =
                    10,

                AvailableSlots =
                    10,

                Schedules =
                    BuildWeeklySchedule(),

                IsActive =
                    true,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

        var station2 =
            new SolarStationInfo
            {
                StationCode =
                    "SS-MAL-001",

                StationName =
                    "Malabe Solar Station",

                Latitude =
                    6.9147,

                Longitude =
                    79.9733,

                CapacityKw =
                    80,

                BatteryStorageSlots =
                    8,

                AvailableSlots =
                    8,

                Schedules =
                    BuildWeeklySchedule(),

                IsActive =
                    true,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

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

    private async Task<string> GetOrCreateStationAsync(
        IMongoCollection<SolarStationInfo> collection,
        SolarStationInfo station,
        CancellationToken cancellationToken)
    {
        // Look up the station by its stable station code before creating it.
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

    private static List<StationSchedule>
        BuildWeeklySchedule()
    {
        // Build the standard development operating schedule for all seven days.
        return new List<StationSchedule>
        {
            new()
            {
                Day =
                    "Monday",

                OpeningTime =
                    new TimeSpan(
                        8,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        18,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Tuesday",

                OpeningTime =
                    new TimeSpan(
                        8,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        18,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Wednesday",

                OpeningTime =
                    new TimeSpan(
                        8,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        18,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Thursday",

                OpeningTime =
                    new TimeSpan(
                        8,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        18,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Friday",

                OpeningTime =
                    new TimeSpan(
                        8,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        18,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Saturday",

                OpeningTime =
                    new TimeSpan(
                        9,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        17,
                        0,
                        0),

                IsAvailable =
                    true
            },

            new()
            {
                Day =
                    "Sunday",

                OpeningTime =
                    new TimeSpan(
                        9,
                        0,
                        0),

                ClosingTime =
                    new TimeSpan(
                        17,
                        0,
                        0),

                IsAvailable =
                    true
            }
        };
    }

    // =====================================================
    // Shared Development Energy Slot Seed Data
    // =====================================================

    private async Task SeedSlotsAsync(
        IReadOnlyList<string> stationIds,
        CancellationToken cancellationToken)
    {
        // Verify the two expected seed station IDs exist before creating slots.
        if (stationIds.Count < 2)
        {
            _logger.LogWarning(
                "Energy slot seeding skipped because the required seed stations are unavailable.");

            return;
        }

        var collection =
            _database.GetCollection<EnergyBookingSlot>(
                "EnergyBookingSlots");

        var slotDate =
            DateTime.UtcNow
                .Date
                .AddDays(1);

        var slots =
            new List<EnergyBookingSlot>
            {
                // Jaffna station slots.
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

                // Malabe station slots.
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
            // Insert each known development slot only when it does not already exist.
            await SeedSlotIfMissingAsync(
                collection,
                slot,
                cancellationToken);
        }
    }

    private static EnergyBookingSlot CreateSlot(
        string stationId,
        DateTime slotDate,
        TimeSpan startTime,
        TimeSpan endTime,
        double capacityKw)
    {
        // Build a new available energy slot with consistent capacity values.
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

    private async Task SeedSlotIfMissingAsync(
        IMongoCollection<EnergyBookingSlot> collection,
        EnergyBookingSlot slot,
        CancellationToken cancellationToken)
    {
        // Identify the seed slot using station, date and time boundaries.
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