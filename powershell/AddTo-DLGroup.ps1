# 1. Define Variables
$UserUPN  = "sarah.smith@parramatta.onmicrosoft.com"
$GroupName = "All Staff"

# 2. Connect to Exchange Online

Write-Host "Clearing active memory spaces..." -ForegroundColor Cyan
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

# PowerShell 7 handles this connection cleanly without messing up your Graph token memory

Write-Host "Connecting to Exchange Online (PowerShell 7 Mode)..." -ForegroundColor Cyan
Connect-ExchangeOnline -UserPrincipalName "admin@parramatta.onmicrosoft.com"

try {
    Write-Host "Adding $UserUPN to Distribution List '$GroupName'..." -ForegroundColor Cyan
    # Standard modern Exchange cmdlet accepted natively by Distribution Lists
    Add-DistributionGroupMember -Identity $GroupName -Member $UserUPN -BypassSecurityGroupManagerCheck -ErrorAction Stop
    
    Write-Host "Success! $UserUPN has been officially added to the '$GroupName' distribution list." -ForegroundColor Green
}
catch {
    # Clean check in case the user was already added in a previous test
    if ($_.Exception.Message -like "*already exists*" -or $_.Exception.InnerException.Message -like "*already exists*") {
        Write-Host " [SKIP] $UserUPN is already a member of '$GroupName'." -ForegroundColor Yellow
    } else {
        Write-Error "Failed to add user to Distribution List. Error: $_"
    }
}
finally {
    # 3. Disconnect cleanly
    Disconnect-ExchangeOnline -Confirm:$false
    Write-Host "Disconnected from Exchange Online." -ForegroundColor Yellow
}