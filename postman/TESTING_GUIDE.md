# API testing guide

How to test the reservation workflow with the Postman collection. Routes, roles and status codes below come from the backend source and were spot-checked against a running local API.

## Roles and status conventions

| Situation | HTTP status |
|---|---|
| No token, invalid or expired token | 401, empty body |
| Valid token, wrong role (`[Authorize(Roles=...)]`) | 403, empty body |
| Resource not found (`KeyNotFoundException`) | 404, `{ statusCode, message }` |
| Business-rule or validation failure (`InvalidOperationException`, `ArgumentException`) | 400, `{ statusCode, message }` |
| Duplicate NIC or email (`ConflictException`) | 409 |
| A rule that throws `UnauthorizedAccessException` inside a service (for example wrong password, or updating someone else's reservation) | 401 |
| Malformed JSON or wrong body shape | 400 (ASP.NET validation response, not the `{ statusCode, message }` shape) |
| Success | 200, or 201 for create (`POST /reservations`, `/stations`, `/slots`, `/users`, `/auth/register`) |

Enum values: `ReservationStatus` 0 Pending, 1 Approved, 2 Rejected, 3 Cancelled, 4 Completed. `TransactionStatus` 0 NotStarted, 1 Verified, 2 Completed.

## Before you start

1. API running at `http://localhost:5130`, MongoDB reachable, environment imported and passwords filled in locally (see the README).
2. A bookable slot must exist: unbooked, `Available`, dated today through 7 days ahead. The seeded slots are dated the day after first startup, so on an older database they are likely out of range. Use **04 Energy Slots > Create slot (Backoffice)** to make one.

## Main success flow

Run these in order. Each step saves what the next needs.

| # | Request | Folder | Expected |
|---|---|---|---|
| 1 | Login - Prosumer | 01 | 200, saves `prosumerToken` |
| 2 | Login - Grid Operator | 01 | 200, saves `operatorToken` |
| 3 | Login - Backoffice | 01 | 200, saves `backofficeToken` (needed to create slots) |
| 4 | Get all stations | 03 | 200, saves `stationId` |
| 5 | Create slot (Backoffice) | 04 | 201, saves `slotId` and `slotDate` |
| 6 | Get all slots (optional, picks an existing slot instead of step 5) | 04 | 200 |
| 7 | Create reservation (Prosumer) | 05 | 201, `status` 0, `transactionStatus` 0, saves `reservationId` |
| 8 | Create reservation again - duplicate | 05 | 400 "already applied" (run straight after step 7) |
| 9 | Get my reservations / Get all reservations / Get by id | 05 | 200 |
| 10 | Approve reservation (Grid Operator) | 05 | 200, `status` 1, saves `qrToken` |
| 11 | Verify QR (Grid Operator) | 06 | 200, `transactionStatus` 1 |
| 12 | Complete reservation (Grid Operator) | 07 | 200, `status` 4, `transactionStatus` 2 |
| 13 | Check final state | 07 | 200, `status` 4 |

State flow:

```
Pending (0)  ->  Approved (1)  ->  QR Verified (transaction 1)  ->  Completed (4, transaction 2)
```

### The QR verify body

`POST /api/reservations/verify-qr` expects a **bare JSON string** as the body:

```
"abc123"
```

It does **not** accept an object such as `{ "qrToken": "abc123" }`, which returns 400. The collection sends `"{{qrToken}}"`, so the raw body must keep the surrounding quotes and be sent as JSON. The operator scans the QR code the prosumer sees for the approved reservation, and the scanned text is this token.

## Reject flow (separate)

Rejecting is a different outcome for a different reservation. Never approve and reject the same reservation.

Folder **09 Optional Flows > Reject flow** does it in three steps:

1. Create a fresh slot (Backoffice), 201.
2. Create a NEW reservation (Prosumer), 201, status Pending.
3. Reject reservation (Grid Operator): **HTTP 200 and `status` = 2**.

Only Pending reservations can be rejected. Rejecting an Approved, Completed or Cancelled reservation returns 400 "Only pending reservations can be rejected."

## Other optional flows (folder 09)

- **Update flow:** create a reservation on slot A, create slot B, then `PUT /reservations/{id}` moves it to slot B. Only Pending reservations can be updated, and only more than 12 hours before the start.
- **Cancel flow:** `DELETE /reservations/{id}` returns 200 "Reservation cancelled successfully." Cancel is refused within 12 hours of the start time and for Completed or Cancelled reservations. Slots created by the collection are for tomorrow at a random hour, so an early-morning slot tested late in the evening can fall inside the 12-hour lock. Re-run the slot step if you get 400.

These flows use their own `flow*` variables, so they do not overwrite `reservationId` from the main flow.

## Negative tests (folder 08)

Run folder 08 **after** the main flow so that `reservationId` refers to a Completed reservation. The duplicate-reservation check is in folder 05 for the reason given above.

| Test | Expected |
|---|---|
| No token | 401 |
| Invalid token | 401 |
| Wrong password | 401 "Invalid NIC or password." |
| Register with an existing NIC | 409 |
| Register with an invalid email | 400 |
| Malformed login JSON | 400 |
| Prosumer calls `GET /reservations` (operator only) | 403 |
| Prosumer calls approve | 403 |
| Grid Operator calls `GET /reservations/my` (prosumer only) | 403 |
| Grid Operator calls `POST /reservations` | 403 |
| Unknown reservation id (well-formed ObjectId) | 404 "Reservation not found." |
| Create reservation with unknown station | 404 "Station not found." |
| Create reservation with unknown slot | 404 "Slot not found." |
| Reservation date does not match the slot date | 400 |
| Reject a reservation that is not Pending | 400 "Only pending reservations can be rejected." |
| Approve a reservation that is not Pending | 400 "Only pending reservations can be approved." |
| Verify QR with an unknown token | 404 "Invalid QR token." |
| Verify QR with an object body | 400 |
| Complete without a verified QR | 400 "Reservation QR must be verified before completion." |
| Reserve a slot whose available capacity is 0 | 400 "Selected slot is full." (three requests: create slot, set capacity to 0, reserve) |
| Duplicate reservation for the same slot and date | 400 (folder 05) |

Notes on specific cases:

- **Complete without verification:** run in the middle of the main flow (after Approve, before Verify QR) to hit the exact case. Run after the flow, the reservation is already Completed and the API returns the same message.
- **Malformed ObjectIds** (not 24 hex characters) were not tested. The negative tests use a well-formed id that does not exist, which is the case confirmed to return 404.
- **Slot is full:** reservations do not reduce a slot's `availableCapacityKw`. A slot only becomes full when a Backoffice user sets its available capacity to 0, which is what the three-step test does.
- **Someone else's reservation:** updating or cancelling a reservation you do not own is refused by the service (`UnauthorizedAccessException`, so 401). It is not in the collection because it needs a second prosumer account.

## Clean-up

The collection leaves test data behind: extra slots, reservations, a station, and users created by the Users folder. There is no delete for reservations or slots in the API. Use a development database and drop the collections if you want a clean state (see `database/SEED_DATA.md`).
