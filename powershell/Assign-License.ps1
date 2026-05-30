# 1. Define variables
$UserUPN = "sarah.smith@parramatta.onmicrosoft.com"
# $BusinessStandardSkuId = "6470687e-a530-4e77-8d51-67af094391c5" # Standard SKU for M365 Business Standard
$BusinessPremiumSkuId = "cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46" # Standard SKU for M365 Business Premium (Trial)

# 2. Connect to Microsoft Graph
# Note: 'Directory.ReadWrite.All' is required to modify licenses
Write-Host "Connecting to Microsoft Graph..." -ForegroundColor Cyan
Connect-MgGraph -Scopes "User.Read.All", "Directory.ReadWrite.All" -ContextScope CurrentUser -UseDeviceAuthentication

try {
    Write-Host "Looking for user: $UserUPN..." -ForegroundColor Cyan
    $User = Get-MgUser -UserId $UserUPN -ErrorAction SilentlyContinue

    if (-not $User) {
        Write-Host " [ERROR] User '$UserUPN' not found. Cannot assign license." -ForegroundColor Red
    } 
    else {
        # 3. Verify Usage Location (Critical Step)
        # M365 will reject licensing if the user has no location assigned
        if ([string]::IsNullOrEmpty($User.UsageLocation)) {
            Write-Host "User has no UsageLocation. Setting it to 'US' to allow licensing..." -ForegroundColor Yellow
            Update-MgUser -UserId $User.Id -UsageLocation "US"
        }

        Write-Host "Assigning Microsoft 365 Business Premium license..." -ForegroundColor Cyan

        # 4. Construct the license object
        $LicenseObject = @{
            AddLicenses = @(
                @{ SkuId = $BusinessPremiumSkuId }
            )
            RemoveLicenses = @() # Required by the API, even if empty
        }

        # 5. Apply the license
        Set-MgUserLicense -UserId $User.Id -BodyParameter $LicenseObject
        
        Write-Host "Success! Business Premium license has been assigned to $UserUPN." -ForegroundColor Green
    }
}
catch {
    Write-Error "Failed to assign license. Error: $_"
}
finally {
    # 6. Clean up session
    Disconnect-MgGraph
    Write-Host "Disconnected from Microsoft Graph." -ForegroundColor Yellow
}