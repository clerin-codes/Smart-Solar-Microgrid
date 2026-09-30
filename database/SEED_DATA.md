# Seed data

Source: `server/src/SmartSolarMicrogrid.Api/SeedData/SeedDataService.cs`, called from `Program.cs` at startup (section "Seed Database").

## When it runs

Every time the API starts, `SeedAsync()` runs three steps in this order: users, stations, slots. Each step checks the database first and only creates what is missing, so restarting the API does not duplicate data.

| Step | Skip condition |
|---|---|
| Users | Checked per account. Each of the three accounts is created only if no user with its NIC exists |
| Stations | Skipped entirely if the `SolarStationInfo` collection has any document |
| Slots | Skipped if the `EnergyBookingSlots` collection has any document, or if no stations are available |

## What the seed does not do

- It creates **no reservations**. The `EnergyReservation` collection starts empty.
- It does not update or repair existing documents.
- The slots are created for one day only: `DateTime.UtcNow.Date + 1 day` at the time the slots are first seeded. On an existing database those slots are not refreshed, so they fall outside the 7-day booking window as time passes. Create new slots as a Backoffice user (`POST /api/slots`) to keep testing.

## Users

| NIC | Full name | Role | Email | Phone |
|---|---|---|---|---|
| `200000000001` | System Backoffice Admin | Backoffice | `admin@smartsolar.local` | `0770000001` |
| `200000000002` | Grid Operator | GridOperator | `operator@smartsolar.local` | `0770000002` |
| `200000000003` | Demo Solar Prosumer | Prosumer | `prosumer@smartsolar.local` | `0770000003` |

Passwords: `<seed-password>`. The seed passes a fixed demo password to BCrypt, and only the hash is stored. The demo passwords for local development are listed in the root `README.md` under "Demo Login Credentials". They are not repeated here. Change or remove these accounts before any real deployment.

All three accounts are created with `IsActive = true`.

## Stations

| Code | Name | Latitude | Longitude | CapacityKw | BatteryStorageSlots | AvailableSlots |
|---|---|---|---|---|---|---|
| `SS-JFN-001` | Jaffna Solar Station | 9.6615 | 80.0255 | 100 | 10 | 10 |
| `SS-MAL-001` | Malabe Solar Station | 6.9147 | 79.9733 | 80 | 8 | 8 |

Both stations have the same weekly schedule, and all seven days are marked available:

| Days | Opening | Closing |
|---|---|---|
| Monday to Friday | 08:00 | 18:00 |
| Saturday, Sunday | 09:00 | 17:00 |

## Energy booking slots

Five slots, all with `Status = Available`, dated the day after they are first seeded (UTC):

| Station | Time | CapacityKw | AvailableCapacityKw |
|---|---|---|---|
| Jaffna Solar Station | 09:00 to 10:00 | 20 | 20 |
| Jaffna Solar Station | 10:00 to 11:00 | 20 | 20 |
| Jaffna Solar Station | 11:00 to 12:00 | 30 | 30 |
| Malabe Solar Station | 09:00 to 10:00 | 15 | 15 |
| Malabe Solar Station | 14:00 to 15:00 | 25 | 25 |

## Resetting

To re-seed from scratch, drop the affected collections in your own MongoDB database and restart the API. Do this only on a development database.
