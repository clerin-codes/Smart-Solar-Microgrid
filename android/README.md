# SunChain Android app

Kotlin + Jetpack Compose app for **Solar Prosumers** and **Grid Operators**. Admin (Backoffice) accounts use the web portal.

## What it does

| Role | Features |
| --- | --- |
| Prosumer | Register / sign in, browse stations (list, search, favourites, map), see slots for the next 7 days, book, edit or cancel a reservation (locked 12 hours before the slot), QR code after approval (save to gallery, share), verification tracking, transaction history, PDF receipt (save / share), profile |
| Grid Operator | Dashboard (live, refreshes every 15 s), approve reservations, camera QR scanner (CameraX + ML Kit) or paste a token, verify, confirm energy transfer, transactions (today / recent, status filter, search), PDF receipt |
| Both | Offline mode (Room cache, banner with last sync time), auto-sync when the network returns, background sync + notifications every 15 min (WorkManager), profile edit, server address setting |

## Architecture

MVVM with a repository layer. Dependencies are wired by hand in `SunChainApp` / `AppContainer` (no DI framework).

```
data/remote   Retrofit ApiService, DTOs, ApiProvider (auth interceptor, error mapping)
data/local    Room database (stations, slots, reservations, favourites), SessionStore
data/repo     AuthRepository, StationRepository, ReservationRepository, SyncManager
ui/           Compose screens + ViewModels: auth, prosumer, operator, profile, common, nav
notifications ChangeDetector, Notifier, SyncWorker
util          TimeRules (booking window + 12 h lock), Fmt, QrCodes, Files, ReceiptPdf
```

## Run it

1. Start the API (`server/`) so it listens on port 5130.
2. Open `android/` in Android Studio and run on an emulator. The app talks to `http://10.0.2.2:5130/api/` by default (the emulator's alias for your computer).
3. On a **physical phone** on the same Wi-Fi, either change the address on the login screen ("Server: ..."), or create `android/local.properties` (git-ignored):

```
api.baseUrl=http://192.168.1.20:5130/api/
MAPS_API_KEY=your-google-maps-key
```

Without `MAPS_API_KEY` the map view lists stations with an "Open in Maps" button instead of an embedded Google Map.

Demo accounts (created by the API seed): Grid Operator `200000000002` / `Operator@123`, Prosumer `200000000003` / `Prosumer@123`. Or register a new prosumer in the app.

## Tests

```
./gradlew :app:testDebugUnitTest            # JVM unit tests (booking rules, filters, change detection, parsing, QR encoding)
./gradlew :app:connectedDebugAndroidTest    # UI tests on an emulator/device, against the running API
```

The instrumented tests drive the real UI and use the API directly to create test data (fresh slots and prosumers each run), so the API and MongoDB must be running. They grant the notification and camera permissions themselves.

## Notes

- Timestamps: the API can return a reservation date as the previous day at 18:30 UTC (Sri Lanka midnight). The app converts every timestamp to the Sri Lanka calendar day (`dayOf`), so dates are correct whichever timezone the server runs in.
- Push notifications use local notifications driven by background sync, not Firebase, so no Google project is needed.
- The JWT is kept in private app preferences. For production, move it to an encrypted store and use HTTPS (the manifest currently allows cleartext HTTP for local development).
