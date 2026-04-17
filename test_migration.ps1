# Simple script to test migration endpoint
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN_HERE"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/notifications/migration/migrate-all" -Method POST -Headers $headers -Body "{}"
    $response | ConvertTo-Json
} catch {
    Write-Error "Error: $_"
}
