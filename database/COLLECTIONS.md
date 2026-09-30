# Collections reference

Field types are in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md). This file describes what each collection is for, how it relates to the others and which rules the backend applies. Every rule below comes from the service and controller code.

## Users (`UserDetails`)

**Purpose:** all accounts. The role decides which API endpoints the account can use.

**Relationships:** referenced by `EnergyReservation.ProsumerNIC` (the prosumer). Operator NICs are stored as plain strings in `ApprovedBy` and `CompletedBy`.

**Business rules:**
- The NIC is the primary key, so a NIC can exist only once.
- Email must be unique. This is checked in the auth service on registration and on profile update, and a clash returns HTTP 409. There is no database index behind it.
- Registration requires a NIC, a full name, a valid email, a phone number matching `^\+?[0-9]{9,12}$`, and a password of at least 8 characters. Self-registered users are always Prosumers.
- Passwords are stored as BCrypt hashes.
- Users are deactivated, never deleted (`IsActive = false`). Inactive users cannot log in, and cannot create, approve or complete reservations.
- Backoffice users can create, update, deactivate and reactivate any user through `/api/users`. Every signed-in user can read and update only their own profile through `/api/auth/profile`.

## Stations (`SolarStationInfo`)

**Purpose:** the physical solar stations, with location, capacity and weekly opening hours.

**Relationships:** referenced by slots (`StationId`) and reservations (`StationId`).

**Business rules:**
- `CapacityKw` and `BatteryStorageSlots` must be greater than zero.
- Stations are soft-deleted with `IsActive = false`. A station cannot be deactivated while it has Pending or Approved reservations.
- A slot cannot be created for an inactive station, and reservations cannot be made at one.
- Only Backoffice users create, update or deactivate stations. Any signed-in user can read them.

## Energy booking slots (`EnergyBookingSlots`)

**Purpose:** a dated time window at a station with a capacity in kW.

**Relationships:** belongs to one station (`StationId`). Referenced by reservations (`SlotId`).

**Business rules:**
- On create and update the slot date cannot be in the past, `EndTime` must be later than `StartTime`, and `CapacityKw` must be greater than zero and no larger than the station capacity.
- On update, `AvailableCapacityKw` must be between 0 and `CapacityKw`.
- A reservation is refused when the slot's `AvailableCapacityKw` is 0 or less ("Selected slot is full").
- Reservations do not reduce `AvailableCapacityKw` or `Status`. The code that creates, approves, cancels or completes a reservation does not change the slot. Whether a slot is taken is decided by looking for an active reservation for that slot and date.
- Only Backoffice users create or update slots. Any signed-in user can read them.

## Reservations (`EnergyReservation`)

**Purpose:** a prosumer's request to use a slot, the operator's decision, and the QR-based energy transfer.

**Relationships:**

```
Reservation
   ├── ProsumerNIC → UserDetails._id   (the prosumer who booked)
   ├── StationId   → SolarStationInfo._id
   └── SlotId      → EnergyBookingSlots._id
```

The slot must belong to the station. `StartTime` and `EndTime` are copied from the slot when the reservation is made.

**Lifecycle:**

```
create (Prosumer)           Status = Pending,  TransactionStatus = NotStarted
   ├── approve (Operator)   Status = Approved, QRToken generated
   │      └── verify-qr (Operator)  TransactionStatus = Verified
   │             └── complete (Operator)  Status = Completed, TransactionStatus = Completed
   ├── reject (Operator)    Status = Rejected     (only from Pending)
   ├── update (Prosumer)    stays Pending, moves to another slot (only from Pending)
   └── cancel (Prosumer)    Status = Cancelled    (refused if already Completed or Cancelled)
```

**Business rules:**
- Only a Prosumer can create, update or cancel. Only a Grid Operator can list all, approve, reject, verify a QR code or complete.
- The reservation date must match the slot's date, cannot be in the past, and must be no more than 7 days ahead, all in Sri Lanka time.
- A prosumer cannot hold two active (Pending or Approved) reservations for the same slot and date.
- A slot and date can have only one active (Pending or Approved) reservation from anyone.
- Update and cancel are only allowed at least 12 hours before the slot starts. Only the owner can update or cancel.
- Only Pending reservations can be approved, rejected or updated. Completed reservations cannot be cancelled.
- Approve generates the `QRToken`. QR verification needs an Approved reservation. Completion needs `TransactionStatus = Verified`.
- Reservation numbers look like `RES-20260101093000-4821`.
