# Postman collection

API tests for the Smart Solar Microgrid backend (ASP.NET Core Web API, MongoDB, JWT).

| File | Purpose |
|---|---|
| `Smart-Solar-Microgrid.postman_collection.json` | 63 requests in 9 folders, with test scripts that check status codes and capture tokens and ids |
| `Smart-Solar-Microgrid.postman_environment.json` | Local environment (`baseUrl = http://localhost:5130/api`) |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | The order to run things in, and the expected results |

## Setup

1. Start MongoDB access and the API (`server/src/SmartSolarMicrogrid.Api`, `dotnet run`). The API listens on `http://localhost:5130`.
2. In Postman choose **Import** and select both JSON files.
3. Select the environment **Smart Solar Microgrid - Local**.
4. Fill in `prosumerPassword`, `operatorPassword` and `backofficePassword` in your **local** copy of the environment. They are blank in the committed file on purpose. The demo accounts are seeded by the API (see `database/SEED_DATA.md` and the root `README.md`). The NIC variables are pre-filled with the seeded NICs.
5. Run **01 Authentication** first. It saves `prosumerToken`, `operatorToken` and `backofficeToken`.

Do not commit an environment file that contains passwords or tokens. The token and password variables are typed as `secret` so Postman hides them.

## Folders

| Folder | Contents |
|---|---|
| 01 Authentication | Login for the three roles, register, get and update own profile |
| 02 Users | Backoffice user management (`/users`) |
| 03 Stations | List, get, create, update and deactivate stations |
| 04 Energy Slots | List, get, get by station, create and update slots |
| 05 Reservations | Create, duplicate check, list, get, approve |
| 06 QR Verification | `POST /reservations/verify-qr` |
| 07 Transactions | `POST /reservations/{id}/complete` and a final-state check |
| 08 Negative Tests | Authentication, authorization, not-found, validation and business-rule failures |
| 09 Optional Flows | Reject flow, update flow, cancel flow, each on its own slot and reservation |

QR verification and transaction completion are part of `ReservationsController`. The collection keeps those real routes, and there are no `/qr` or `/transactions` endpoints.

## Variables

| Variable | Set by | Meaning |
|---|---|---|
| `baseUrl` | environment | API root including `/api` |
| `prosumerNic`, `operatorNic`, `backofficeNic` | environment | Seeded account NICs |
| `prosumerPassword`, `operatorPassword`, `backofficePassword` | you, locally | Left blank in the repository |
| `prosumerToken`, `operatorToken`, `backofficeToken` | the login requests | JWTs |
| `stationId` | Get all stations / Get all slots | Station used for bookings |
| `slotId`, `slotDate` | Get all slots / Create slot | Slot to reserve, `slotDate` is sent back as `reservationDate` |
| `reservationId` | Create reservation | Reservation used through the main flow |
| `qrToken` | Approve reservation | QR token, used by Verify QR |

Requests also create some scratch variables (`newSlotDate`, `fullSlotId`, `flowReservationId`, `createdStationId`, `newUserNic` and similar). They are set by scripts and need no manual input.

## Notes

- The reservation endpoints identify the prosumer from the JWT, never from the request body.
- `verify-qr` takes a bare JSON string body, `"abc123"`, not an object.
- Seeded slots are only created for one day and expire out of the 7-day window. Use **Create slot** in folder 04 (Backoffice) to get a fresh one.
- Running the collection creates data in the database you point it at. Use a development database.
