using MongoDB.Driver;

using SmartSolarMicrogrid.Api.Models;

namespace SmartSolarMicrogrid.Api.SeedData;

public class SeedDataService
{
    private readonly IMongoDatabase _database;

    public SeedDataService(IMongoDatabase database)
    {
        _database = database;
    }

    public async Task SeedAsync()
    {
        await SeedUsersAsync();

        var stationIds =
            await SeedStationsAsync();

        await SeedSlotsAsync(stationIds);
    }


    // ======================================================
    // 1. Seed Users
    // ======================================================

    private async Task SeedUsersAsync()
    {
        var collection =
            _database.GetCollection<UserDetails>(
                "UserDetails");

        // --------------------------------------------------
        // Backoffice User
        // --------------------------------------------------

        var backofficeExists =
            await collection
                .Find(x => x.NIC == "200000000001")
                .AnyAsync();

        if (!backofficeExists)
        {
            var backoffice = new UserDetails
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
                        "Admin@123"),

                Role =
                    UserRole.Backoffice,

                IsActive = true,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

            await collection.InsertOneAsync(
                backoffice);

            Console.WriteLine(
                "Seed: Backoffice user created.");
        }


        // --------------------------------------------------
        // Grid Operator User
        // --------------------------------------------------

        var operatorExists =
            await collection
                .Find(x => x.NIC == "200000000002")
                .AnyAsync();

        if (!operatorExists)
        {
            var gridOperator = new UserDetails
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
                        "Operator@123"),

                Role =
                    UserRole.GridOperator,

                IsActive = true,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

            await collection.InsertOneAsync(
                gridOperator);

            Console.WriteLine(
                "Seed: Grid Operator user created.");
        }


        // --------------------------------------------------
        // Prosumer User
        // --------------------------------------------------

        var prosumerExists =
            await collection
                .Find(x => x.NIC == "200000000003")
                .AnyAsync();

        if (!prosumerExists)
        {
            var prosumer = new UserDetails
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
                        "Prosumer@123"),

                Role =
                    UserRole.Prosumer,

                IsActive = true,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

            await collection.InsertOneAsync(
                prosumer);

            Console.WriteLine(
                "Seed: Prosumer user created.");
        }
    }


    // ======================================================
    // 2. Seed Solar Stations
    // ======================================================

    private async Task<List<string>> SeedStationsAsync()
    {
        var collection =
            _database.GetCollection<SolarStationInfo>(
                "SolarStationInfo");

        var existingStations =
            await collection
                .Find(_ => true)
                .ToListAsync();

        // If stations already exist,
        // use existing station IDs.
        if (existingStations.Count > 0)
        {
            Console.WriteLine(
                "Seed: Stations already exist. Skipping station creation.");

            return existingStations
                .Select(x => x.Id)
                .ToList();
        }


        // --------------------------------------------------
        // Station 1
        // --------------------------------------------------

        var station1 = new SolarStationInfo
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
                new List<StationSchedule>
                {
                    new StationSchedule
                    {
                        Day = "Monday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Tuesday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Wednesday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Thursday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Friday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Saturday",
                        OpeningTime =
                            new TimeSpan(9, 0, 0),
                        ClosingTime =
                            new TimeSpan(17, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Sunday",
                        OpeningTime =
                            new TimeSpan(9, 0, 0),
                        ClosingTime =
                            new TimeSpan(17, 0, 0),
                        IsAvailable = true
                    }
                },

            IsActive = true,

            CreatedAt =
                DateTime.UtcNow,

            UpdatedAt =
                DateTime.UtcNow
        };


        // --------------------------------------------------
        // Station 2
        // --------------------------------------------------

        var station2 = new SolarStationInfo
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
                new List<StationSchedule>
                {
                    new StationSchedule
                    {
                        Day = "Monday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Tuesday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Wednesday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Thursday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Friday",
                        OpeningTime =
                            new TimeSpan(8, 0, 0),
                        ClosingTime =
                            new TimeSpan(18, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Saturday",
                        OpeningTime =
                            new TimeSpan(9, 0, 0),
                        ClosingTime =
                            new TimeSpan(17, 0, 0),
                        IsAvailable = true
                    },

                    new StationSchedule
                    {
                        Day = "Sunday",
                        OpeningTime =
                            new TimeSpan(9, 0, 0),
                        ClosingTime =
                            new TimeSpan(17, 0, 0),
                        IsAvailable = true
                    }
                },

            IsActive = true,

            CreatedAt =
                DateTime.UtcNow,

            UpdatedAt =
                DateTime.UtcNow
        };


        await collection.InsertManyAsync(
            new[]
            {
                station1,
                station2
            });

        Console.WriteLine(
            "Seed: Solar stations created.");

        return new List<string>
        {
            station1.Id,
            station2.Id
        };
    }


    // ======================================================
    // 3. Seed Energy Booking Slots
    // ======================================================

    private async Task SeedSlotsAsync(
        List<string> stationIds)
    {
        if (stationIds.Count == 0)
        {
            return;
        }

        var collection =
            _database.GetCollection<EnergyBookingSlot>(
                "EnergyBookingSlots");

        var existingSlots =
            await collection
                .Find(_ => true)
                .AnyAsync();

        if (existingSlots)
        {
            Console.WriteLine(
                "Seed: Slots already exist. Skipping slot creation.");

            return;
        }


        var slotDate =
            DateTime.UtcNow.Date.AddDays(1);


        // --------------------------------------------------
        // Station 1 Slots
        // --------------------------------------------------

        var station1Slots =
            new List<EnergyBookingSlot>
            {
                new EnergyBookingSlot
                {
                    StationId =
                        stationIds[0],

                    SlotDate =
                        slotDate,

                    StartTime =
                        new TimeSpan(9, 0, 0),

                    EndTime =
                        new TimeSpan(10, 0, 0),

                    CapacityKw =
                        20,

                    AvailableCapacityKw =
                        20,

                    Status =
                        SlotStatus.Available,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        DateTime.UtcNow
                },

                new EnergyBookingSlot
                {
                    StationId =
                        stationIds[0],

                    SlotDate =
                        slotDate,

                    StartTime =
                        new TimeSpan(10, 0, 0),

                    EndTime =
                        new TimeSpan(11, 0, 0),

                    CapacityKw =
                        20,

                    AvailableCapacityKw =
                        20,

                    Status =
                        SlotStatus.Available,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        DateTime.UtcNow
                },

                new EnergyBookingSlot
                {
                    StationId =
                        stationIds[0],

                    SlotDate =
                        slotDate,

                    StartTime =
                        new TimeSpan(11, 0, 0),

                    EndTime =
                        new TimeSpan(12, 0, 0),

                    CapacityKw =
                        30,

                    AvailableCapacityKw =
                        30,

                    Status =
                        SlotStatus.Available,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        DateTime.UtcNow
                }
            };


        // --------------------------------------------------
        // Station 2 Slots
        // --------------------------------------------------

        var station2Slots =
            new List<EnergyBookingSlot>
            {
                new EnergyBookingSlot
                {
                    StationId =
                        stationIds[1],

                    SlotDate =
                        slotDate,

                    StartTime =
                        new TimeSpan(9, 0, 0),

                    EndTime =
                        new TimeSpan(10, 0, 0),

                    CapacityKw =
                        15,

                    AvailableCapacityKw =
                        15,

                    Status =
                        SlotStatus.Available,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        DateTime.UtcNow
                },

                new EnergyBookingSlot
                {
                    StationId =
                        stationIds[1],

                    SlotDate =
                        slotDate,

                    StartTime =
                        new TimeSpan(14, 0, 0),

                    EndTime =
                        new TimeSpan(15, 0, 0),

                    CapacityKw =
                        25,

                    AvailableCapacityKw =
                        25,

                    Status =
                        SlotStatus.Available,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        DateTime.UtcNow
                }
            };


        var slots =
            station1Slots
                .Concat(station2Slots)
                .ToList();


        await collection.InsertManyAsync(
            slots);

        Console.WriteLine(
            "Seed: Energy booking slots created.");
    }
}