# M365 Staff Onboarding Wiki & Script Manager

A modern, single-page reference application for Microsoft 365 administrators to manage and execute staff onboarding.

## Key Features

- **Interactive Wiki Guide**: Step-by-step documentation for provisioning M365 user profiles, assigning licenses, enforcing MFA, setting DL groups, and drafting manager notifications.
- **PowerShell Script Viewer**: A centralized portal containing structured onboarding PowerShell scripts (built on Microsoft Graph API and Exchange Online Management Shell) with real-time syntax highlighting.
- **Dynamic Deep Linking & Routing**: Fully synchronized hash-based URL routing (e.g., `#scripts-Create-User.ps1` or `#section-mfa`) for sharing specific configurations and pages.
- **Visual Enhancements**: Global screenshot visibility toggle, zoom/pan lightbox modals, and inline copy templates for managers.

## Script Execution Requirements

These administrative scripts require **PowerShell 7+ (PS7)** and specific M365 module libraries to execute correctly.

### 1. Install PowerShell 7
Open your standard Windows PowerShell console and run the following winget command:
```powershell
winget install --id Microsoft.Powershell --source winget
```
*Note: Restart your terminal session after installation to load the `pwsh` environment.*

### 2. Install Required PowerShell Modules
Launch PowerShell 7 (`pwsh`) and run the following command to download and install the required Microsoft Graph and Exchange Online modules:
```powershell
Install-Module -Name Microsoft.Graph, ExchangeOnlineManagement -Scope CurrentUser -Force
```

## Setup & Technologies

- Built with standard **HTML5**, modern **Vanilla CSS** (design system variables, fluid responsiveness), and **ES6 Javascript**.
- Zero dependencies for clean, secure deployment. Just open `index.html` in any browser to get started.
