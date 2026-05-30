# --- Configuration ---
$TenantDomain = "parramatta.onmicrosoft.com"
$CsvPath      = ".\users.csv"

# --- Connect to Microsoft Graph ---
Write-Host "Connecting to Microsoft Graph..." -ForegroundColor Cyan
Connect-MgGraph -Scopes "User.ReadWrite.All", "User.Read.All" -UseDeviceAuthentication

# --- Import CSV ---
$Users = Import-Csv $CsvPath

foreach ($Row in $Users) {
    $UPN = "$($Row.FirstName).$($Row.LastName)@$TenantDomain".ToLower()
    Write-Host "`n--- Processing: $UPN ---" -ForegroundColor Cyan

    $ExistingUser = Get-MgUser -UserId $UPN -ErrorAction SilentlyContinue
    
    if ($ExistingUser) {
        Write-Host " [SKIP] User '$UPN' already exists." -ForegroundColor Yellow
        $NewUser = $ExistingUser
    } else {
        $UserParams = @{
            DisplayName       = "$($Row.FirstName) $($Row.LastName)"
            GivenName         = $Row.FirstName
            Surname           = $Row.LastName
            UserPrincipalName = $UPN
            MailNickname      = "$($Row.FirstName).$($Row.LastName)".ToLower()
            UsageLocation     = $Row.UsageLocation
            JobTitle          = $Row.JobTitle
            Department        = $Row.Department
            AccountEnabled    = $true
            PasswordProfile   = @{
                Password                      = "SecurePassword123!"
                ForceChangePasswordNextSignIn = $true
            }
        }

        try {
            $NewUser = New-MgUser @UserParams
            Write-Host " [SUCCESS] Created user: $UPN" -ForegroundColor Green
        }
        catch {
            $ErrorMessage = $_.Exception.Message
            Write-Error " [ERROR] Failed to create '$UPN': $ErrorMessage"
            continue 
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($Row.ManagerEmail)) {
        $Manager = Get-MgUser -UserId $Row.ManagerEmail -ErrorAction SilentlyContinue
        
        if ($Manager -and $NewUser) {
            try {
                $ManagerParams = @{ "@odata.id" = "https://graph.microsoft.com/v1.0/users/$($Manager.Id)" }
                Set-MgUserManagerByRef -UserId $NewUser.Id -BodyParameter $ManagerParams
                Write-Host " [INFO] Assigned manager: $($Row.ManagerEmail)" -ForegroundColor Gray
            }
            catch {
                # FIXED: Extracting the error message to a variable first
                
                Write-Warning " [WARN] Failed to assign manager to $UPN."
            }
        } else {
            Write-Warning " [WARN] Could not assign manager. Check if Manager ('$($Row.ManagerEmail)') exists."
        }
    }
}

Disconnect-MgGraph
Write-Host "`nProcess Complete." -ForegroundColor Green