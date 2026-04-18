# Migration Script for Existing Tickets
# Replace YOUR_JWT_TOKEN_HERE with your actual JWT token

$jwtToken = "YOUR_JWT_TOKEN_HERE"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $jwtToken"
}

Write-Host "Running migration for existing tickets..."
Write-Host "Backend: http://localhost:8080"

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/notifications/migration/migrate-all" -Method POST -Headers $headers -Body "{}"
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Migration completed successfully!"
        $responseContent = $response | ConvertFrom-Json
        Write-Host "Notifications created: $($responseContent.notificationsCreated)"
    } else {
        Write-Host "❌ Migration failed with status: $($response.StatusCode)"
        Write-Host "Response: $($response.Content)"
    }
} catch {
    Write-Host "❌ Error occurred: $_"
}
