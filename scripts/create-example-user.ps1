# Yapp User Signup Script
# Requires: PowerShell 5+ and the Yapp backend running at http://localhost:8080
# Usage:
#   1) Start the backend server (Yapp)
#   2) Open PowerShell at repo root: D:\Coding\Projects\Yapp
#   3) Run: .\yapp-frontend\scripts\create-example-user.ps1

param(
    [string]$Email = "example@gmail.com",
    [string]$Password = "Password@123",
    [string]$Username = "",
    [string]$ApiBase = ""
)

# Set API base URL
if (-not $ApiBase -or $ApiBase.Trim() -eq "") {
    $ApiBase = $env:NEXT_PUBLIC_API_BASE
    if (-not $ApiBase -or $ApiBase.Trim() -eq "") {
        $ApiBase = "http://localhost:8080"
    }
}

# Generate username if not provided
if (-not $Username -or $Username.Trim() -eq "") {
    $usernameBase = $Email.Split('@')[0].Trim()
    if ($usernameBase.Length -lt 3) {
        $usernameBase = ($usernameBase + "___").Substring(0, 3)
    }
    $Username = $usernameBase
}

Write-Host "=== Yapp User Signup Script ===" -ForegroundColor Cyan
Write-Host "API Base: $ApiBase"
Write-Host "Email: $Email"
Write-Host "Username: $Username"
Write-Host "Password: [HIDDEN]"
Write-Host ""

# Test basic connectivity first
Write-Host "Testing server connectivity..." -ForegroundColor Yellow
try {
    $testResponse = Invoke-WebRequest -Uri "$ApiBase/" -Method GET -TimeoutSec 10
    Write-Host "✓ Server is responding (Status: $($testResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ Server connectivity test failed:" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure your backend is running with: docker compose up" -ForegroundColor Yellow
    exit 1
}

# Create the payload
$payload = @{
    username = $Username
    password = $Password
    email = $Email
} | ConvertTo-Json -Depth 3

Write-Host "Payload:" -ForegroundColor Yellow
Write-Host $payload -ForegroundColor Gray
Write-Host ""

# Make the signup request
Write-Host "Sending signup request to $ApiBase/auth/signup" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Method Post -Uri "$ApiBase/auth/signup" -Body $payload -ContentType 'application/json' -TimeoutSec 30

    Write-Host "✓ User created successfully!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green

    if ($response.Content) {
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            $jsonResponse | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
        } catch {
            Write-Host $response.Content -ForegroundColor Green
        }
    } else {
        Write-Host "(Empty response body)" -ForegroundColor Yellow
    }

} catch {
    Write-Host "✗ Failed to create user" -ForegroundColor Red
    Write-Host "Exception: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        $statusDescription = $_.Exception.Response.StatusDescription

        Write-Host "Status Code: $statusCode ($statusDescription)" -ForegroundColor Red

        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $reader.Close()

            if ($errorBody -and $errorBody.Trim() -ne "") {
                Write-Host "Server Response:" -ForegroundColor Red
                try {
                    $jsonError = $errorBody | ConvertFrom-Json
                    $jsonError | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Red
                } catch {
                    Write-Host $errorBody -ForegroundColor Red
                }
            } else {
                Write-Host "Server returned empty response body" -ForegroundColor Red
            }
        } catch {
            Write-Host "Could not read response body: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "No HTTP response received" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Check if your backend is running: docker compose ps" -ForegroundColor Yellow
    Write-Host "2. Check backend logs: docker compose logs -f yapp-server" -ForegroundColor Yellow
    Write-Host "3. Verify database is healthy: docker compose logs postgres" -ForegroundColor Yellow

    exit 1
}

Write-Host ""
Write-Host "Script completed successfully!" -ForegroundColor Cyan