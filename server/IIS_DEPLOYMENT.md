# IIS deployment — Smart Solar Microgrid API

The production IIS binding for this assignment is HTTP port `9339`. Run the commands below in an **Administrator PowerShell** only when deploying or repairing IIS; they change machine-level configuration.

## Prerequisites

1. Install the .NET 8 ASP.NET Core Hosting Bundle.
2. Enable IIS and the Management Console.
3. Ensure MongoDB is reachable from the application-pool identity.
4. Keep secrets outside source control, for example as IIS environment variables or a local ignored `appsettings.Production.json`.
5. Keep `SeedData:Enabled` false in production. Demo accounts are seeded automatically only in the Development environment unless this setting is explicitly enabled.

## Publish

From `server/src/SmartSolarMicrogrid.Api`:

```powershell
dotnet restore
dotnet publish -c Release --no-restore -o C:\inetpub\SmartSolarMicrogrid.Api
```

The publish output must contain `SmartSolarMicrogrid.Api.dll` and the generated `web.config`.

## Create the IIS application pool and site

```powershell
Import-Module WebAdministration

New-WebAppPool -Name "SmartSolarMicrogrid.Api"
Set-ItemProperty "IIS:\AppPools\SmartSolarMicrogrid.Api" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\SmartSolarMicrogrid.Api" -Name processModel.identityType -Value ApplicationPoolIdentity

New-Website `
  -Name "SmartSolarMicrogrid.Api" `
  -PhysicalPath "C:\inetpub\SmartSolarMicrogrid.Api" `
  -Port 9339 `
  -ApplicationPool "SmartSolarMicrogrid.Api"
```

If the site already exists, update its physical path instead of creating a duplicate:

```powershell
Set-ItemProperty "IIS:\Sites\SmartSolarMicrogrid.Api" -Name physicalPath -Value "C:\inetpub\SmartSolarMicrogrid.Api"
Restart-WebAppPool "SmartSolarMicrogrid.Api"
```

## Firewall

Only add this rule when other machines or physical Android devices must reach the API:

```powershell
New-NetFirewallRule `
  -DisplayName "Smart Solar Microgrid API 9339" `
  -Direction Inbound `
  -Action Allow `
  -Protocol TCP `
  -LocalPort 9339
```

## Verify

```powershell
Invoke-RestMethod http://localhost:9339/api/health
```

Expected response:

```json
{"status":"OK","database":"Connected"}
```

For a physical Android device, use the development machine's LAN IP instead of `localhost`. For the Android emulator, use `10.0.2.2`.
