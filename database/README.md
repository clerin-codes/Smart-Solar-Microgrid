# Database documentation

This folder documents the MongoDB database used by the Smart Solar Microgrid backend. It contains documentation only. There are no scripts, dumps or credentials here.

| File | Contents |
|---|---|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Field-level schema of every collection, enums and relationships |
| [COLLECTIONS.md](COLLECTIONS.md) | Collection-by-collection reference with business rules |
| [SEED_DATA.md](SEED_DATA.md) | What the backend seeds on startup and when |
| [SAMPLE_DOCUMENTS.md](SAMPLE_DOCUMENTS.md) | Safe, fictional example documents |

## How the database is used

- The ASP.NET Core Web API (`server/src/SmartSolarMicrogrid.Api`) is the **only** component that talks to MongoDB, through the official MongoDB .NET driver.
- The web app and the Android app never connect to MongoDB. They call the REST API, and the API reads and writes the database.
- Each collection has one repository class (`Repositories/`) that owns its `IMongoCollection<T>`. Business rules live in the services (`Services/`), not in the database.
- The connection string and database name come from `MongoDbSettings` in the API configuration (`appsettings.example.json` shows the shape). The database name in the example is `SmartSolarMicrogrid`.
- The API defines no custom indexes, serializers or validation schemas. All uniqueness and consistency rules (for example unique email, one active reservation per slot) are enforced in service code.

## Main collections

| Collection name in MongoDB | C# model | Purpose |
|---|---|---|
| `UserDetails` | `UserDetails` | Accounts for Backoffice, Grid Operator and Prosumer |
| `SolarStationInfo` | `SolarStationInfo` | Solar stations and their opening schedules |
| `EnergyBookingSlots` | `EnergyBookingSlot` | Time slots that can be reserved at a station |
| `EnergyReservation` | `EnergyReservation` | Reservations, QR token and transaction state |

Note that the reservations collection name is singular (`EnergyReservation`), while the slots collection is plural (`EnergyBookingSlots`). These are the exact names used in the repositories.

## Where seed data comes from

`SeedData/SeedDataService.cs` runs once at API startup and creates three demo accounts, two stations and their slots if they are missing. See [SEED_DATA.md](SEED_DATA.md).

## Reading the schema

1. Start with [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the fields and enums.
2. Read [COLLECTIONS.md](COLLECTIONS.md) for how the collections relate and which rules apply.
3. Use [SAMPLE_DOCUMENTS.md](SAMPLE_DOCUMENTS.md) to see what stored documents look like.

## Security note

Do not commit connection strings, JWT secrets, real password hashes or tokens to this repository. Passwords are stored only as BCrypt hashes in `UserDetails.PasswordHash`. The documents in this folder use placeholders such as `<REDACTED>`. Demo login values for local development are listed in the root `README.md`, not here.
