# =========================================================================
# CONFIGURATION
# =========================================================================
$FirstName     = "Sarah"
$LastName      = "Smith"
$DisplayName   = "$FirstName $LastName"
$JobTitle      = "Software Engineer"
$Department    = "Engineering"
$UsageLocation = "AU"                  
$TenantDomain  = "parramatta.onmicrosoft.com"
$ManagerEmail  = "manager@parramatta.onmicrosoft.com"
$TargetGroup   = "All Users"
$TargetDL      = "All Staff"
$SkuId         = "cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46" 

# NEW: Adjustable account sync delay (in seconds)
$SyncDelay      = 50 # 50 secs wait before adding user to a DL / increase delay if failing to add

# =========================================================================
# MODULE & LOGIN MANAGEMENT
# =========================================================================
Import-Module Microsoft.Graph.Users, Microsoft.Graph.Groups, ExchangeOnlineManagement

Write-Host "Clearing active memory spaces..." -ForegroundColor Cyan
Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

Write-Host "Connecting to Microsoft Graph..." -ForegroundColor Cyan
Connect-MgGraph -Scopes "User.ReadWrite.All","Directory.ReadWrite.All","Group.ReadWrite.All","Mail.Send" -TenantId "b2e0ee9b-9f23-441d-b528-421759b7e8e7" -UseDeviceAuthentication

$CurrentContext = Get-MgContext
$AdminEmail = $CurrentContext.Account

Write-Host "Hooking Exchange Online Shell Core onto $AdminEmail..." -ForegroundColor Cyan
Connect-ExchangeOnline -UserPrincipalName $AdminEmail -Organization "parramatta.onmicrosoft.com" -ErrorAction Stop | Out-Null

try {
    # ---------------------------------------------------------------------
    # STEP 1: CREATE USER
    # ---------------------------------------------------------------------
    $RandomPassword = [System.IO.Path]::GetRandomFileName() + [System.IO.Path]::GetRandomFileName().Substring(0,4).ToUpper() + "26!"
    $MailNickname   = "$($FirstName).$($LastName)".ToLower()
    $UserPrincipal  = "$MailNickname@$TenantDomain"

    Write-Host "`n[STEP 1] Creating user account for $DisplayName..." -ForegroundColor Cyan
    $NewUser = New-MgUser -AccountEnabled -DisplayName $DisplayName -GivenName $FirstName -Surname $LastName -JobTitle $JobTitle -Department $Department -UsageLocation $UsageLocation -MailNickname $MailNickname -UserPrincipalName $UserPrincipal -PasswordProfile @{ ForceChangePasswordNextSignIn = $true; Password = $RandomPassword } -ErrorAction Stop
    Write-Host "Success! User object created." -ForegroundColor Green

    # ---------------------------------------------------------------------
    # STEP 2: LICENSE ASSIGNMENT
    # ---------------------------------------------------------------------
    Set-MgUserLicense -UserId $NewUser.Id -AddLicenses @(@{ SkuId = $SkuId }) -RemoveLicenses @() -ErrorAction Stop
    Write-Host "`n[STEP 2] Assigning License..." -ForegroundColor Cyan
    Write-Host "Success! License assigned." -ForegroundColor Green

    # ---------------------------------------------------------------------
    # STEP x: PROPAGATION DELAY (CRITICAL FIX)
    # ---------------------------------------------------------------------
    Write-Host "`nWaiting $SyncDelay seconds for directory synchronization..." -ForegroundColor Yellow
    Start-Sleep -Seconds $SyncDelay

    # ---------------------------------------------------------------------
    # STEP 3: GROUP MEMBERSHIPS
    # ---------------------------------------------------------------------
    # M365 Group
    Write-Host "`n[STEP 3] Discovering active administrator identity...'" -ForegroundColor Cyan
    Write-Host "Attempting to add user to M365 Group '$TargetGroup'..." -ForegroundColor Cyan
    $Group = Get-MgGroup -Filter "displayName eq '$TargetGroup'" -ErrorAction SilentlyContinue
    if ($Group) {
        New-MgGroupMember -GroupId $Group.Id -DirectoryObjectId $NewUser.Id -ErrorAction SilentlyContinue
        Write-Host "Success! Added to M365 Group '$TargetGroup'." -ForegroundColor Green
    }

    # Distribution List
    Write-Host "Attempting to add user to DL '$TargetDL'..." -ForegroundColor Cyan
    try {
        Add-DistributionGroupMember -Identity $TargetDL -Member $UserPrincipal -BypassSecurityGroupManagerCheck -ErrorAction Stop
        Write-Host "Success! Added to DL '$TargetDL'." -ForegroundColor Green
    }
    catch {
        if ($_.Exception.Message -like "*already exists*") {
            Write-Host " [SKIP] User already in '$TargetDL'." -ForegroundColor Yellow
        } else {
            Write-Host " [ERROR] Unable to add to DL '$TargetDL. Increase delay to ensure complete synchronization." -ForegroundColor Red
        }
    }

        # ---------------------------------------------------------------------
    # STEP 4: SEND WELCOME EMAIL TO MANAGER
    # ---------------------------------------------------------------------
    Write-Host "`n[STEP 4] Discovering active administrator identity..." -ForegroundColor Cyan
    $CurrentContext = Get-MgContext
    $AdminEmail = $CurrentContext.Account

    Write-Host "Drafting provisioning overview for $ManagerEmail..." -ForegroundColor Cyan
    
    $EmailBody = @"
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333;">
        <h2 style="color: #0078d4;">User Onboarding Automated Report</h2>
        <p>Hello,</p>
        <p>The system profile setup for <strong>$DisplayName</strong> has finished processing.</p>
        
        <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 20px 0;">
            <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; width: 40%;">Detail Resource</th>
                <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Target Value</th>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px; font-weight: bold;">User Principal Name:</td>
                <td style="border: 1px solid #dddddd; padding: 8px; color: #0078d4;">$UserPrincipal</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px; font-weight: bold;">Temporary Password:</td>
                <td style="border: 1px solid #dddddd; padding: 8px; font-family: Consolas, monospace; background-color: #fafafa;">$RandomPassword</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dddddd; padding: 8px; font-weight: bold;">Assigned License Plan:</td>
                <td style="border: 1px solid #dddddd; padding: 8px;">M365 Business Premium (SPB Bundle)</td>
            </tr>
        </table>

        <p style="background-color: #fff9e6; border-left: 4px solid #ffcc00; padding: 10px; max-width: 500px;">
            <strong>MFA Warning:</strong> Conditional Access Policies are active for this account. The user will be requested to enroll an authenticator method and cycle their password immediately upon their first authentication event.
        </p>
        
        <p>Regards,<br>IT Identity Provisioning System</p>
    </body>
    </html>
"@

    $MailParameters = @{
        UserId = $AdminEmail
        Message = @{
            Subject = "Account Ready: $DisplayName ($UserPrincipal)"
            Body = @{
                ContentType = "Html"
                Content     = $EmailBody
            }
            ToRecipients = @(
                @{ EmailAddress = @{ Address = $ManagerEmail } }
            )
        }
    }

    Write-Host "Transmitting credential dispatch via Graph Mail Engine..." -ForegroundColor Cyan
    Send-MgUserMail @MailParameters -ErrorAction Stop
    Write-Host "Success! Notification sent safely to $ManagerEmail." -ForegroundColor Green

    Write-Host "`n=========================================================================" -ForegroundColor Green
    Write-Host " COMPLETE: Automated provisioning execution ended successfully!" -ForegroundColor Green
    Write-Host "=========================================================================`n" -ForegroundColor Green


}
catch {
    Write-Host "`n [CRITICAL ERROR] User already exists." -ForegroundColor Red
}
finally {
    Disconnect-MgGraph -ErrorAction SilentlyContinue | Out-Null
    Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
}