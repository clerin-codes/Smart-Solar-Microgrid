# Sample documents

**SAMPLE DOCUMENTS ONLY.** Every value below is fictional. The IDs are made-up ObjectId-style strings, the NICs and contact details are invented, and no real password hash or token is shown. They illustrate the shape of the stored documents (field names as stored, enums as integers). See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for the types.

In real MongoDB these documents hold `ObjectId("...")` and ISODate values. They are written here in relaxed JSON for readability.

## 1. User (`UserDetails`)

```json
{
  "_id": "199912345678",
  "FullName": "Sample Prosumer",
  "Email": "sample.prosumer@example.test",
  "PhoneNumber": "0771234567",
  "PasswordHash": "<REDACTED>",
  "Role": 2,
  "IsActive": true,
  "CreatedAt": "2026-01-15T08:30:00Z",
  "UpdatedAt": "2026-01-15T08:30:00Z"
}
```

`_id` is the NIC. `Role: 2` is Prosumer.

## 2. Station (`SolarStationInfo`)

```json
{
  "_id": "64b000000000000000000001",
  "StationCode": "SS-XXX-001",
  "StationName": "Sample Solar Station",
  "Latitude": 7.0000,
  "Longitude": 80.0000,
  "CapacityKw": 50.0,
  "BatteryStorageSlots": 5,
  "AvailableSlots": 5,
  "Schedules": [
    { "Day": "Monday",   "OpeningTime": "08:00:00", "ClosingTime": "18:00:00", "IsAvailable": true },
    { "Day": "Saturday", "OpeningTime": "09:00:00", "ClosingTime": "17:00:00", "IsAvailable": true }
  ],
  "IsActive": true,
  "CreatedAt": "2026-01-10T06:00:00Z",
  "UpdatedAt": "2026-01-10T06:00:00Z"
}
```

## 3. Energy booking slot (`EnergyBookingSlots`)

```json
{
  "_id": "64b000000000000000000101",
  "StationId": "64b000000000000000000001",
  "SlotDate": "2026-01-20T00:00:00Z",
  "StartTime": "09:00:00",
  "EndTime": "10:00:00",
  "CapacityKw": 20.0,
  "AvailableCapacityKw": 20.0,
  "Status": 0,
  "CreatedAt": "2026-01-10T06:00:00Z",
  "UpdatedAt": "2026-01-10T06:00:00Z"
}
```

`Status: 0` is Available. `StationId` points at the station above.

## 4. Reservations (`EnergyReservation`)

A newly created reservation:

```json
{
  "_id": "64b000000000000000000201",
  "ReservationNumber": "RES-20260118101500-4821",
  "ProsumerNIC": "199912345678",
  "StationId": "64b000000000000000000001",
  "SlotId": "64b000000000000000000101",
  "ReservationDate": "2026-01-20T00:00:00Z",
  "StartTime": "09:00:00",
  "EndTime": "10:00:00",
  "Status": 0,
  "QRToken": null,
  "QRGeneratedAt": null,
  "TransactionStatus": 0,
  "ApprovedBy": null,
  "CompletedBy": null,
  "CompletedAt": null,
  "CreatedAt": "2026-01-18T10:15:00Z",
  "UpdatedAt": "2026-01-18T10:15:00Z"
}
```

The same reservation after approval, QR verification and completion:

```json
{
  "_id": "64b000000000000000000201",
  "ReservationNumber": "RES-20260118101500-4821",
  "ProsumerNIC": "199912345678",
  "StationId": "64b000000000000000000001",
  "SlotId": "64b000000000000000000101",
  "ReservationDate": "2026-01-20T00:00:00Z",
  "StartTime": "09:00:00",
  "EndTime": "10:00:00",
  "Status": 4,
  "QRToken": "<sample-qr-token>",
  "QRGeneratedAt": "2026-01-18T11:00:00Z",
  "TransactionStatus": 2,
  "ApprovedBy": "200000000002",
  "CompletedBy": "200000000002",
  "CompletedAt": "2026-01-20T09:20:00Z",
  "CreatedAt": "2026-01-18T10:15:00Z",
  "UpdatedAt": "2026-01-20T09:20:00Z"
}
```

`Status: 4` is Completed and `TransactionStatus: 2` is Completed. `ApprovedBy` and `CompletedBy` hold the operator's NIC.
