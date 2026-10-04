param(
    [string]$Destination = 'C:\Publish\SmartSolarMicrogridAPI'
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Join-Path $PSScriptRoot 'src\SmartSolarMicrogrid.Api'
$project = Join-Path $projectDirectory 'SmartSolarMicrogrid.Api.csproj'
$stagingDirectory = Join-Path $projectDirectory 'bin\iis-publish'
$destinationDirectory = (Resolve-Path -LiteralPath $Destination).Path
$offlineFile = Join-Path $destinationDirectory 'app_offline.htm'

if (Test-Path -LiteralPath $offlineFile) {
    throw 'The destination already contains app_offline.htm. Resolve the existing maintenance operation first.'
}

# Build before interrupting the running IIS application.
dotnet publish $project -c Release -o $stagingDirectory
if ($LASTEXITCODE -ne 0) {
    throw 'Release publish failed. IIS was not taken offline.'
}

$ownsOfflineFile = $false
try {
    Set-Content -LiteralPath $offlineFile -Value '<html><body>Updating the API. Please retry shortly.</body></html>'
    $ownsOfflineFile = $true

    # ASP.NET Core Module stops this application when app_offline.htm appears.
    $deployedAssembly = Join-Path $destinationDirectory 'SmartSolarMicrogrid.Api.dll'
    $unlocked = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        try {
            if (Test-Path -LiteralPath $deployedAssembly) {
                $handle = [System.IO.File]::Open($deployedAssembly, 'Open', 'ReadWrite', 'None')
                $handle.Dispose()
            }
            $unlocked = $true
            break
        }
        catch [System.IO.IOException] {
            Start-Sleep -Milliseconds 500
        }
    }
    if (!$unlocked) { throw 'IIS did not release the API assembly within 20 seconds.' }

    # Preserve deployment-specific settings, including IIS Development mode and secrets.
    foreach ($file in Get-ChildItem -LiteralPath $stagingDirectory -File -Recurse) {
        if ($file.Name -eq 'web.config' -or $file.Name -like 'appsettings*.json') { continue }
        $relativePath = $file.FullName.Substring($stagingDirectory.Length).TrimStart('\', '/')
        $target = [System.IO.Path]::GetFullPath((Join-Path $destinationDirectory $relativePath))
        if (!$target.StartsWith($destinationDirectory.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) {
            throw 'A publish file resolved outside the destination directory.'
        }
        $null = New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force
        Copy-Item -LiteralPath $file.FullName -Destination $target -Force
    }
    Write-Output "Updated IIS application files in $destinationDirectory."
}
finally {
    if ($ownsOfflineFile) {
        # Remove only the maintenance file created by this invocation.
        Remove-Item -LiteralPath $offlineFile -Force
    }
}
