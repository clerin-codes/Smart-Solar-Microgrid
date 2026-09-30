# Database schema

Derived from the C# models in `server/src/SmartSolarMicrogrid.Api/Models/` and the repositories in `Repositories/`. MongoDB itself is schemaless, so "required" below means "non-nullable in the C# model" and is not a database constraint.

## Storage conventions

| C# type | How the driver stores it (defaults; no custom serializers are configured) |
|---|---|
| `string` with `[BsonRepresentation(BsonType.ObjectId)]` | `ObjectId` in MongoDB, `string` in the API |
| `DateTime` | BSON date (UTC) |
| `TimeSpan` | string such as `"09:00:00"` |
| enum | 32-bit integer (the numeric value shown in the tables below) |
| `bool`, `double`, `int` | as-is |
| `List<StationSchedule>` | embedded array of sub-documents |

The models use PascalCase property names, so the stored field names are PascalCase (`StationName`, `SlotDate`). The API serializes to camelCase JSON, so JSON responses use `stationName`, `slotDate` and so on.

## Enums

| Enum | Values |
|---|---|
| `UserRole` | 0 = Backoffice, 1 = GridOperator, 2 = Prosumer |
| `ReservationStatus` | 0 = Pending, 1 = Approved, 2 = Rejected, 3 = Cancelled, 4 = Completed |
| `TransactionStatus` | 0 = NotStarted, 1 = Verified, 2 = Completed |
| `SlotStatus` | 0 = Available, 1 = Full, 2 = Closed |

## 1. Users

- **Collection:** `UserDetails`
- **Purpose:** every account that can sign in.
- **Primary identifier:** `NIC` (a string, mapped to `_id` with `[BsonId]`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `NIC` (`_id`) | string | yes | Unique by virtue of being `_id`. Used as the JWT subject |
| `FullName` | string | yes | |
| `Email` | string | yes | Uniqueness is enforced by `AuthService` (registration and profile update), not by an index |
| `PhoneNumber` | string | yes | Validated by the auth service with `^\+?[0-9]{9,12}$` |
| `PasswordHash` | string | yes | BCrypt hash. The plaintext is never stored |
| `Role` | `UserRole` | yes | |
| `IsActive` | bool | yes | Default `true`. Inactive users cannot log in |
| `CreatedAt` | DateTime (UTC) | yes | |
| `UpdatedAt` | DateTime (UTC) | yes | |

## 2. Stations

- **Collection:** `SolarStationInfo`
- **Purpose:** solar stations that prosumers book energy slots at.
- **Primary identifier:** `Id` (ObjectId).

| Field | Type | Required | Notes |
|---|---|---|---|
| `Id` (`_id`) | ObjectId (string in the API) | yes | |
| `StationCode` | string | yes | For example a code such as `SS-XXX-001` |
| `StationName` | string | yes | |
| `Latitude` | double | yes | |
| `Longitude` | double | yes | |
| `CapacityKw` | double | yes | Must be greater than zero (station service) |
| `BatteryStorageSlots` | int | yes | Must be greater than zero (station service) |
| `AvailableSlots` | int | yes | Stored on the station. Seed data sets it equal to `BatteryStorageSlots` |
| `Schedules` | array of `StationSchedule` | yes | May be empty |
| `IsActive` | bool | yes | Default `true`. Deactivation is a soft delete |
| `CreatedAt`, `UpdatedAt` | DateTime (UTC) | yes | |

Embedded `StationSchedule`:

| Field | Type | Notes |
|---|---|---|
| `Day` | string | For example `"Monday"` |
| `OpeningTime` | TimeSpan | |
| `ClosingTime` | TimeSpan | |
| `IsAvailable` | bool | Default `true` |

## 3. Energy booking slots

- **Collection:** `EnergyBookingSlots`
- **Purpose:** a bookable time window at a station.
- **Primary identifier:** `Id` (ObjectId).

| Field | Type | Required | Notes |
|---|---|---|---|
| `Id` (`_id`) | ObjectId | yes | |
| `StationId` | ObjectId | yes | Reference to `SolarStationInfo._id` |
| `SlotDate` | DateTime (UTC) | yes | The day of the slot |
| `StartTime` | TimeSpan | yes | |
| `EndTime` | TimeSpan | yes | Must be later than `StartTime` |
| `CapacityKw` | double | yes | Greater than zero and not above the station capacity |
| `AvailableCapacityKw` | double | yes | Between 0 and `CapacityKw` |
| `Status` | `SlotStatus` | yes | Default Available |
| `CreatedAt`, `UpdatedAt` | DateTime (UTC) | yes | |

## 4. Reservations

- **Collection:** `EnergyReservation`
- **Purpose:** a prosumer's booking of a slot, including approval, QR token and transaction state.
- **Primary identifier:** `Id` (ObjectId).

| Field | Type | Required | Notes |
|---|---|---|---|
| `Id` (`_id`) | ObjectId | yes | |
| `ReservationNumber` | string | yes | Generated as `RES-<yyyyMMddHHmmss>-<4 digits>` |
| `ProsumerNIC` | string | yes | Reference to `UserDetails._id`. Taken from the JWT at creation |
| `StationId` | ObjectId | yes | Reference to `SolarStationInfo._id` |
| `SlotId` | ObjectId | yes | Reference to `EnergyBookingSlots._id` |
| `ReservationDate` | DateTime (UTC) | yes | Must fall on the same Sri Lanka day as the slot |
| `StartTime` | TimeSpan | yes | Copied from the slot |
| `EndTime` | TimeSpan | yes | Copied from the slot |
| `Status` | `ReservationStatus` | yes | Starts as Pending |
| `QRToken` | string | no | Set when the reservation is approved |
| `QRGeneratedAt` | DateTime? | no | |
| `TransactionStatus` | `TransactionStatus` | yes | Starts as NotStarted |
| `ApprovedBy` | string | no | Operator NIC |
| `CompletedBy` | string | no | Operator NIC |
| `CompletedAt` | DateTime? | no | |
| `CreatedAt`, `UpdatedAt` | DateTime (UTC) | yes | |

## Relationships

```
UserDetails (NIC) 1 ──────< EnergyReservation.ProsumerNIC
SolarStationInfo (_id) 1 ──< EnergyBookingSlots.StationId
SolarStationInfo (_id) 1 ──< EnergyReservation.StationId
EnergyBookingSlots (_id) 1 ─< EnergyReservation.SlotId
```

These are plain reference fields. MongoDB does not enforce them. The services check that the referenced station and slot exist, that the slot belongs to the station, and that the user is a Prosumer.
