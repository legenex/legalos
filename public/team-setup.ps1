# LegalOS team-member setup (Windows)
# Paste this one line into PowerShell to set yourself up:
#   iex (iwr -useb https://mo.legenex.com/team-setup.ps1)
#
# What it does:
#   1. Installs VS Code if you don't have it (via winget).
#   2. Installs the Remote-SSH extension.
#   3. Adds an SSH host entry for our server.
#   4. Launches VS Code already connected to the server, with the project open.
#
# You'll be asked for the server password the first time VS Code connects.
# Get it from Morne via Signal / 1Password.

$ErrorActionPreference = "Stop"

$ServerIp    = "51.81.202.161"
$ProjectPath = "/var/www/vhosts/legenex.com/mo.legenex.com"
$HostAlias   = "legalos"

function Info($msg)    { Write-Host "==> $msg" -ForegroundColor Cyan }
function Ok($msg)      { Write-Host "    $msg" -ForegroundColor Green }
function Warn($msg)    { Write-Host "    $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "LegalOS team setup" -ForegroundColor White
Write-Host "------------------" -ForegroundColor DarkGray

# Step 1: VS Code
Info "Checking for VS Code..."
$codeCmd = Get-Command code -ErrorAction SilentlyContinue
if (-not $codeCmd) {
    Warn "Not found. Installing via winget..."
    winget install --id Microsoft.VisualStudioCode -e --accept-source-agreements --accept-package-agreements --silent
    # Refresh PATH so 'code' is available in this session
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
    $codeCmd = Get-Command code -ErrorAction SilentlyContinue
    if (-not $codeCmd) {
        Write-Host ""
        Write-Host "VS Code was installed but the 'code' command isn't on PATH yet." -ForegroundColor Yellow
        Write-Host "Close this PowerShell window, open a NEW one, and re-run the install command." -ForegroundColor Yellow
        exit 1
    }
    Ok "VS Code installed."
} else {
    Ok "Already installed."
}

# Step 2: Remote-SSH extension
Info "Installing Remote-SSH extension..."
& code --install-extension ms-vscode-remote.remote-ssh --force 2>&1 | Out-Null
Ok "Remote-SSH installed."

# Step 3: SSH config
Info "Adding SSH host '$HostAlias' for $ServerIp..."
$sshDir = Join-Path $env:USERPROFILE ".ssh"
New-Item -ItemType Directory -Force -Path $sshDir | Out-Null
$configFile = Join-Path $sshDir "config"
$existing = if (Test-Path $configFile) { Get-Content $configFile -Raw } else { "" }
if ($existing -match "(?m)^Host\s+$HostAlias\b") {
    Ok "Entry already exists."
} else {
    $entry = @"

Host $HostAlias
    HostName $ServerIp
    User root
    Port 22

"@
    Add-Content -Path $configFile -Value $entry
    Ok "SSH config updated at $configFile"
}

# Step 4: Launch VS Code, already connected, project open
Info "Launching VS Code connected to the server..."
$remoteUri = "vscode-remote://ssh-remote+$HostAlias$ProjectPath"
Start-Process code -ArgumentList "--folder-uri", "`"$remoteUri`""

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host ""
Write-Host "VS Code is opening. When it asks for a password, paste the root password" -ForegroundColor White
Write-Host "Morne sent you. After it connects you're ready to edit." -ForegroundColor White
Write-Host ""
Write-Host "Daily workflow:" -ForegroundColor Cyan
Write-Host "  - Edit any file in the sidebar." -ForegroundColor White
Write-Host "  - Save (Ctrl+S)." -ForegroundColor White
Write-Host "  - Watch https://mo.legenex.com update in ~2 seconds." -ForegroundColor White
Write-Host ""
Write-Host "Read /var/www/vhosts/legenex.com/mo.legenex.com/ONBOARDING.md (in VS Code)" -ForegroundColor DarkGray
Write-Host "for daily-workflow details and what NOT to do." -ForegroundColor DarkGray
