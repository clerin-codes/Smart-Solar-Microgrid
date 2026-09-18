# Smart Solar Microgrid Trading System

A full-stack Smart Solar Microgrid Trading System developed as a university group project. The system provides web and mobile applications connected through a centralized ASP.NET Core Web API and MongoDB database.

## Quick Start — Clone, Run & Verify

### 1. Clone the Repository

```bash
git clone https://github.com/clerin-codes/Smart-Solar-Microgrid.git
cd Smart-Solar-Microgrid
```

> Replace `clerin-codes` with the actual GitHub repository owner if required.

---

### 2. Backend Setup

The backend is built with C# ASP.NET Core Web API.

```bash
cd server/src/SmartSolarMicrogrid.Api
dotnet restore
dotnet run
```

The API should start at:

```text
http://localhost:5130
```

Keep the backend terminal running while testing the web and mobile applications.

#### Verify Backend

Open the API address in your browser:

```text
http://localhost:5130
```

You can also verify the API using Postman.

If Swagger is enabled in the project, open:

```text
http://localhost:5130/swagger/index.html
```

> The exact Swagger availability depends on the project's current configuration.

#### Demo Login Credentials

Use these seeded/demo accounts when testing the API locally:

| Role | NIC | Password |
|---|---|---|
| Solar Prosumer | `200000000003` | `Prosumer@123` |
| Grid Operator | `200000000002` | `Operator@123` |
| Backoffice Admin | `200000000001` | `Admin@123` |

These credentials are for local or academic demonstration only. Do not reuse them in production.

---

### 3. MongoDB Setup

MongoDB is used as the central database.

Make sure MongoDB is running before using the API.

If MongoDB is installed as a Windows service, verify it from Windows Services or start it according to your local MongoDB installation.

Using MongoDB Compass, connect to your configured MongoDB instance.

Example local connection:

```text
mongodb://localhost:27017
```

The required database and collections are:

```text
UserDetails
SolarStationInfo
EnergyBookingSlots
EnergyReservation
```

#### Verify MongoDB

Open MongoDB Compass and confirm that:

1. MongoDB is connected.
2. The project database exists.
3. The required collections are available after the application has created or seeded them.

---

### 4. Web Application Setup

The web application is built with React and Tailwind CSS.

Open a new terminal from the project root:

```bash
cd web/smart-solar-microgrid-web
npm install
npm run dev
```

Vite will normally provide a local address similar to:

```text
mongodb+srv://mongo_db_user:<password>@godatabase.mym8s5g.mongodb.net/
```

#### Verify Web Application

Open the URL shown by Vite in your browser.

You should be able to load the Smart Solar Microgrid web application and connect it to the running backend API.

Keep both terminals running:

```text
Terminal 1 → ASP.NET Core API
Terminal 2 → React Web App
```

---

### 5. Android Application Setup

The Android application is a native Kotlin application.

Open the following folder in Android Studio:

```text
android/
```

Then:

1. Allow Gradle to sync.
2. Make sure an Android emulator or physical Android device is connected.
3. Select the `app` run configuration.
4. Click **Run**.

The Android application supports the required mobile roles, including:

- Solar Prosumer
- Grid Operator

The Android application uses SQLite for local persistence and Google Maps for location/station-related functionality.

#### Verify Android Application

After launching the application:

1. Confirm that the application opens without crashing.
2. Test the login/registration flow when implemented.
3. Verify that API communication works.
4. Verify SQLite/local persistence where applicable.
5. Verify Google Maps functionality when configured.
6. Test role-specific functionality for Prosumer and Grid Operator.

---

## System Architecture

The system follows a centralized client-server architecture:

```text
┌──────────────────────┐
│      Web Client      │
│ React + Tailwind CSS │
└──────────┬───────────┘
           │
           │ REST API
           ▼
┌────────────────────────────┐
│    ASP.NET Core Web API    │
│     Business Logic Layer   │
└────────────┬───────────────┘
             │
             │ MongoDB Driver
             ▼
┌────────────────────────────┐
│          MongoDB           │
│      Central Database      │
└────────────────────────────┘
             ▲
             │
             │ REST API
             │
┌────────────┴───────────────┐
│      Android Client        │
│       Native Kotlin        │
│     SQLite + Google Maps   │
└────────────────────────────┘
```

The web and Android clients communicate with the backend through REST APIs. Clients do not directly access MongoDB.

---

## User Roles

### 1. Backoffice

Backoffice users access the system through the web application.

Main responsibilities include:

- User management
- Solar station management
- Slot management
- System administration

### 2. Grid Operator

Grid Operators use both the web application and Android application.

Main responsibilities include:

- Viewing operational information
- Managing reservations
- QR verification
- Energy transfer processing
- Transaction-related operations

### 3. Solar Prosumer

Solar Prosumers use the Android application.

Main responsibilities include:

- Viewing available solar stations
- Viewing available energy slots
- Making reservations
- Updating reservations
- Cancelling reservations
- Viewing reservation history
- Using QR-based booking/verification functionality where applicable

---

## Main System Workflow

```text
User
  │
  ▼
Web / Android Application
  │
  ▼
ASP.NET Core REST API
  │
  ├── Authentication & Authorization
  ├── User Management
  ├── Station Management
  ├── Slot Management
  ├── Reservation Management
  ├── QR Verification
  └── Transaction / Energy Transfer
  │
  ▼
MongoDB
```

---

## Core Business Rules

The system follows the assignment requirements for reservations and energy transactions.

### Reservation Rules

- Reservations can be made for the next 7 days.
- A reservation must be updated or cancelled at least 12 hours before the scheduled time.
- The system must prevent double booking.
- A station cannot be deactivated while it has active reservations.
- Approved reservations generate a QR code.
- QR codes must be verified by the server before the energy transfer is finalized.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | C# ASP.NET Core Web API |
| Database | MongoDB |
| Web | React.js |
| Web Styling | Tailwind CSS |
| Mobile | Native Android |
| Mobile Language | Kotlin |
| Local Mobile Storage | SQLite |
| Maps | Google Maps |
| API Communication | REST API |
| Version Control | Git & GitHub |
| Backend Deployment | Windows IIS |

---

## Database

The main MongoDB collections required by the system are:

```text
UserDetails
SolarStationInfo
EnergyBookingSlots
EnergyReservation
```

The application follows the rule that web and Android clients communicate with MongoDB only through the ASP.NET Core Web API.

---

## Backend API

The backend is responsible for:

- Authentication and authorization
- User and role management
- Solar station management
- Energy slot management
- Reservation management
- Reservation validation
- QR generation/verification support
- Transaction and energy transfer processing
- Business rule enforcement
- MongoDB data access

### Development Command

From:

```text
server/src/SmartSolarMicrogrid.Api
```

run:

```bash
dotnet restore
dotnet run
```

To stop the development server:

```text
Ctrl + C
```

---

## Web Application

The web application provides the management and operations portal.

It is intended for administrative and operational activities rather than e-commerce.

### Development Commands

```bash
cd web/smart-solar-microgrid-web
npm install
npm run dev
```

### Production Build Check

```bash
npm run build
```

If the build completes successfully, the production build has been generated.

---

## Android Application

The Android application is developed using:

- Kotlin
- Android Studio
- XML Views
- SQLite
- Google Maps

There is one Android application with role-based functionality for:

- Solar Prosumer
- Grid Operator

The application communicates with the backend through REST APIs.

---

## Google Maps

Google Maps is used in the Android application for station/location-related functionality.

A valid Google Maps API key must be configured according to the Android project configuration before map functionality can be tested.

Do not commit API keys or other secrets to GitHub.

---

## QR Code Workflow

The QR workflow is designed around reservation verification.

```text
Reservation Approved
        │
        ▼
    QR Generated
        │
        ▼
Grid Operator Scans QR
        │
        ▼
QR Sent to Backend
        │
        ▼
Server-Side Verification
        │
        ▼
Reservation Validated
        │
        ▼
Energy Transfer Finalized
```

The server performs the important verification rather than trusting only the mobile client.

---

## API Testing with Postman

Postman can be used to test the backend independently from the React and Android applications.

Recommended testing order:

```text
1. Start MongoDB
2. Start ASP.NET Core API
3. Open Postman
4. Test authentication APIs
5. Test user APIs
6. Test station APIs
7. Test slot APIs
8. Test reservation APIs
9. Test QR/transaction APIs
```

For APIs requiring authentication, provide the required authentication token according to the project's implemented authentication mechanism.

---

## Environment Variables & Secrets

Do not commit passwords, API keys, connection strings containing credentials, or other secrets to GitHub.

Use local environment/configuration files where appropriate.

Example placeholders:

```text
MongoDB connection string
JWT secret
Google Maps API key
Email credentials
```

Use `.env.example` or equivalent example configuration files when a configuration template needs to be shared with the team.

---

## Security

Security considerations include:

- Authentication
- Role-based authorization
- Server-side validation
- Input validation
- Secure password handling
- Protected API endpoints
- HTTP-only authentication cookies/tokens where implemented
- Server-side QR verification
- Protection of database credentials and API keys

---

## Deployment

### Backend

The ASP.NET Core Web API is intended to be deployed using:

```text
Windows IIS
```

Before deployment, verify:

```bash
dotnet build
```

and prepare the application using the appropriate publish configuration.

### Web

The React application can be built using:

```bash
npm run build
```

The generated production files can then be deployed according to the selected hosting environment.

### Android

Generate the required Android build from Android Studio after completing testing and configuration.

---

## Git & GitHub Workflow

The project uses Git for version control.

Recommended branch structure:

```text
main
develop
feature/auth
feature/stations
feature/reservations
feature/qr-transactions
```

Typical workflow:

```bash
git checkout develop
git pull origin develop

git checkout -b feature/your-feature

git add .
git commit -m "feat: implement your feature"

git push -u origin feature/your-feature
```

After completing a feature, create a Pull Request to merge the feature branch into `develop`.

Keep commits meaningful and related to actual work.

---

## Team Module Distribution

The project is divided into four major development modules.

### Member 1 — Authentication & Accounts

Backend:
- Authentication
- User management
- Prosumer management

Web:
- User management
- Prosumer management

Android:
- Registration
- Login
- Profile

### Member 2 — Stations & Slots

Backend:
- Solar station management
- Energy booking slots

Web:
- Station management
- Slot management

Android:
- Station map
- Station details
- Available slots

### Member 3 — Reservations

Backend:
- Reservation APIs
- Booking validation
- Reservation business rules

Web:
- Reservation management

Android:
- Create reservation
- Update reservation
- Cancel reservation
- Reservation history

### Member 4 — QR & Transactions

Backend:
- QR-related APIs
- QR verification
- Transaction/energy transfer logic

Web:
- Grid Operator dashboard
- Operational information

Android:
- QR scanner
- QR verification flow
- Energy transfer operation

Each member contributes across the required backend, web, and Android components.

---

## Testing

Testing should cover the main functional and business rules of the system.

Examples include:

- Registration
- Login
- Role-based access
- User management
- Station creation/update/deactivation
- Slot management
- Reservation creation
- Reservation update
- Reservation cancellation
- Double-booking prevention
- 7-day reservation restriction
- 12-hour update/cancellation restriction
- Active-reservation station deactivation restriction
- QR generation
- QR scanning
- Server-side QR verification
- Energy transfer finalization
- API error handling
- Web UI functionality
- Android UI functionality
- SQLite persistence
- Google Maps functionality

---

## Documentation

The project documentation should include the required academic deliverables, such as:

- System architecture
- Use case diagram
- Data Flow Diagrams
- Database design
- API documentation
- Screenshots
- Testing evidence
- Individual contribution
- Challenges and solutions
- AI usage disclosure
- References

Project diagrams and supporting documentation can be maintained under the `docs/` area of the repository.

---

## Project Status

Development is carried out incrementally across:

```text
Backend
   ↓
Database
   ↓
Web
   ↓
Android
   ↓
Integration
   ↓
Testing
   ↓
Deployment
   ↓
Documentation
```

All major features should be tested through the complete client → API → database workflow before final submission.

---

## Demo

The final project should include a demonstration video according to the assignment requirements.

The README can be updated with the final demo video link:

```text
Demo Video: <add-final-demo-video-link-here>
```

---

## Contributors

This is a group project developed by the assigned team members.

Add the final GitHub usernames and names of all team members here before submission.

---

## License

This project is developed for academic purposes as part of the university assignment.

